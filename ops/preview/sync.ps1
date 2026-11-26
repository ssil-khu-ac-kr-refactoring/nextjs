# Windows Docker Desktop, with either loopback-only access or a HTTPS proxy.
param(
    [switch]$LocalOnly,
    [ValidateSet('master', 'codex/preview-base')]
    [string]$BaseBranch = 'master'
)

$ErrorActionPreference = 'Stop'
$docker = (Get-Command docker -CommandType Application -ErrorAction Stop).Source
$repository = 'ssil-khu-ac-kr-refactoring/nextjs'
$previewRegistry = "ghcr.io/$repository-preview"
$projectName = 'ssil-pr-preview'
$composeArguments = @(
    'compose', '--env-file', '.env.preview', '-p', $projectName,
    '-f', 'compose.yml'
)
if (-not $LocalOnly) { $composeArguments += @('-f', 'compose.caddy.yml') }

function Invoke-Docker {
    & $docker @args
    if ($LASTEXITCODE -ne 0) {
        throw "Docker $($args[0]) failed (exit $LASTEXITCODE)."
    }
}

function Invoke-PreviewCompose {
    Invoke-Docker @composeArguments @args
}

function Get-PreviewContainer {
    param([string]$Service, [string[]]$Options)

    Invoke-Docker ps --filter "label=com.docker.compose.project=$projectName" `
        --filter "label=com.docker.compose.service=$Service" @Options
}

function Set-PreviewRef {
    param([string]$Number, [string]$Sha)

    $env:SSIL_PREVIEW_PR = $Number
    $env:SSIL_PREVIEW_SHA = $Sha
    $env:SSIL_PREVIEW_IMAGE = "${previewRegistry}:pr-$Number-$Sha"
}

function Test-PreviewImage {
    param([string]$Image)

    $ErrorActionPreference = 'Continue'
    $PSNativeCommandUseErrorActionPreference = $false
    & $docker manifest inspect $Image *> $null
    return $LASTEXITCODE -eq 0
}

$previewMutex = [System.Threading.Mutex]::new($false, 'Global\SSIL_PrPreviewSync')
$locked = $false
$previousEnv = @{}
foreach ($key in 'SSIL_PREVIEW_PR', 'SSIL_PREVIEW_SHA', 'SSIL_PREVIEW_IMAGE') {
    $previousEnv[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
}

try {
    try { $locked = $previewMutex.WaitOne(0) }
    catch [System.Threading.AbandonedMutexException] { $locked = $true }
    if (-not $locked) {
        Write-Output 'Preview sync is already running.'
        return
    }
    Push-Location -LiteralPath $PSScriptRoot
    try {
        $baseQuery = [Uri]::EscapeDataString($BaseBranch)
        $pullUrl = "https://api.github.com/repos/$repository/pulls?state=open&base=$baseQuery&sort=created&direction=desc&per_page=100"
        $pulls = Invoke-RestMethod -Uri $pullUrl -TimeoutSec 20 -Headers @{
            Accept = 'application/vnd.github+json'
        } -UserAgent 'SSIL-PR-Preview'
        if ($pulls -isnot [array]) {
            throw 'Unexpected GitHub response.'
        }
        $activeImage = Get-PreviewContainer -Service 'preview-app' -Options @('-a', '--format', '{{.Image}}')
        $healthyImage = Get-PreviewContainer -Service 'preview-app' -Options @('--filter', 'health=healthy', '--format', '{{.Image}}')
        $gateway = Get-PreviewContainer -Service 'preview-gateway' -Options @('-q')
        $activeOpen = $false

        foreach ($pull in $pulls) {
            if ($pull.head.repo.full_name -ne $repository) { continue }
            $number = [string]$pull.number
            $sha = [string]$pull.head.sha
            if ($number -notmatch '^[0-9]+$' -or $sha -cnotmatch '^[a-f0-9]{40}$') { continue }

            if ($activeImage -like "${previewRegistry}:pr-$number-*") { $activeOpen = $true }
            Set-PreviewRef -Number $number -Sha $sha
            if ($healthyImage -eq $env:SSIL_PREVIEW_IMAGE -and $gateway) {
                Write-Output "PR #$number is already running at $sha."
                return
            }
            if (-not (Test-PreviewImage -Image $env:SSIL_PREVIEW_IMAGE)) { continue }

            if (-not $LocalOnly) {
                if ((Invoke-Docker network inspect ssil-preview-ingress --format '{{.Internal}}') -ne 'true') {
                    throw 'The internal ssil-preview-ingress network is required.'
                }
            }
            Invoke-PreviewCompose config -q
            Invoke-PreviewCompose pull
            Invoke-PreviewCompose down
            Invoke-PreviewCompose up -d --wait --wait-timeout 150
            Write-Output "Preview ready for PR #$number at $sha."
            return
        }
        if (-not $activeOpen -and ($activeImage -or $gateway)) {
            Set-PreviewRef -Number 0 -Sha ('0' * 40)
            Invoke-PreviewCompose down
        }
        Write-Output 'No newer eligible PR image is ready.'
    } finally {
        Pop-Location
    }
} finally {
    foreach ($key in $previousEnv.Keys) {
        [Environment]::SetEnvironmentVariable($key, $previousEnv[$key], 'Process')
    }
    if ($locked) { $previewMutex.ReleaseMutex() }
    $previewMutex.Dispose()
}
