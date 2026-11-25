# 관리자 PR 미리보기

운영 `/admin/preview`에서 미리보기 환경을 열면 현재 떠 있는 PR 번호와 커밋을 확인할 수 있다. 미리보기 홈에서 검토하고, GitHub에서 변경사항을 승인·병합한다.

## 빌드와 실행

- `master`를 대상으로 하는 이 저장소의 PR이 열리거나 갱신되면 `Build PR preview`가 PR의 병합 후보를 빌드한다. fork의 PR은 제외한다.
- Actions에서 별도 PostgreSQL에 migration과 예시 데이터를 적용하고, 인증·읽기 전용 응답·Home·Research를 검사한다. 검사가 통과한 이미지를 `ghcr.io/ssil-khu-ac-kr-refactoring/nextjs-preview:pr-<번호>-<head SHA>`에 게시한다.
- 미리보기 서버에서는 `sync.sh`가 가장 최근에 열린 PR부터 **현재 head SHA**의 이미지가 있는지 확인하고, 준비된 것 중 한 개를 실행한다. 기존 PR이 열려 있는 동안 새 이미지가 빌드 중이면 마지막으로 배포된 화면을 볼 수 있다. 안내 화면에는 실행 중인 이미지의 SHA가 표시된다.
- Compose 프로젝트는 `ssil-pr-preview`를 사용한다. PostgreSQL은 임시 디스크에서 실행되며, 미리보기를 교체할 때 새로 시작한다. 초기 데이터는 `seed.sql`의 공개 연구 소개 및 이미지이며 페이지마다 실데이터가 필요한 경우 검토용 데이터를 별도로 추가한다.

## 최초 설정

1. Docker Compose v2(`up --wait` 지원), `curl`, `jq`가 있는 미리보기 서버에 **master에서 검토된** 이 폴더의 파일을 둔다. 기존 NAS를 사용할 경우 메모리 여유를 확인한다. 서버의 Docker에 미리보기 GHCR 패키지를 읽을 수 있는 계정으로 로그인한다.
2. 이 폴더에 `.env.preview`를 만들고 해당 작업 계정만 읽을 수 있게 설정한다. 운영 환경 파일 및 운영 DB 자격 증명과 별도로 관리한다.

   ```dotenv
   SSIL_PREVIEW_URL=https://<미리보기 전용 호스트>
   SSIL_PREVIEW_PORT=8091
   SSIL_PREVIEW_USER=<검토용 계정 이름>
   SSIL_PREVIEW_PASSWORD_HASH='<Caddy bcrypt 해시>'
   SSIL_PREVIEW_DB_PASSWORD=<별도로 생성한 32자리 이상 hex 값>
   SSIL_PREVIEW_NEXTAUTH_SECRET=<별도로 생성한 32자리 이상 hex 값>
   ```

   비밀번호 해시는 대화형 `docker run --rm -it caddy:2-alpine caddy hash-password`로 만든다. Compose env 파일에서 해시를 작은따옴표로 감싸 `$` 문자를 보존한다. 평문 비밀번호는 승인된 검토자에게만 전달한다.
3. 전용 호스트의 HTTPS 리버스 프록시가 같은 서버의 `127.0.0.1:8091`로 연결되도록 설정한다. 공용 HTTP 포트로 게이트웨이를 직접 노출하지 않는다. 운영 사이트와 별도 호스트를 사용하고 프록시에서 Authorization 헤더가 전달되도록 한다.
4. `sh /설치경로/sync.sh`를 실행한 뒤 작업 스케줄러에 등록한다. 예를 들어 5분 간격으로 실행한다. Synology에서 Docker 실행 경로를 지정해야 한다면 `DOCKER_BIN=/usr/local/bin/docker sh /설치경로/sync.sh`를 사용한다. GitHub API 통신이나 이미지 다운로드가 실패하면 기존 서비스를 확인하고 다음 주기에 재시도한다.
5. 운영 Next.js 서비스에 `SSIL_PREVIEW_URL=https://<미리보기 전용 호스트>` 환경 변수를 설정한다. 이 값은 브라우저에 보이는 링크의 출처이며 미리보기 인증 정보는 게이트웨이에서 관리한다. 운영 `/admin/preview`는 기존 관리자 세션으로 보호된다.
6. 로그아웃 상태에서 미리보기 주소를 열어 인증이 요구되는지 확인한다. 관리자 메뉴에서 링크를 열고, 검토용 계정으로 로그인해 PR 번호·SHA와 홈을 확인한다.

## 운영 경계

미리보기의 Compose 설정, 인증 게이트웨이, 예시 SQL, 동기화 스크립트는 검토된 `master` 파일을 사용한다. PR 이미지는 전용 Docker 네트워크에서 실행된다. 운영 데이터베이스, 운영 네트워크, 운영 업로드 볼륨, NAS 배포 토큰은 미리보기에 연결하지 않는다. 운영이 사용하는 `:latest` 태그와 webhook은 기존 배포 흐름에서 관리한다.

## Windows Docker Desktop과 컨테이너형 Caddy

운영 HTTPS를 Caddy 컨테이너가 처리하면 Caddy와 미리보기 게이트웨이만 공유하는 내부 네트워크를 사용한다. Caddy 컨테이너의 루프백은 Windows 호스트의 루프백과 별개다.

1. 운영 담당자가 미리보기용 DNS와 HTTPS 호스트를 준비한다. Windows에서 Linux 컨테이너를 실행하는 Docker 컨텍스트와 미리보기 GHCR 패키지 읽기 권한을 확인한다.
2. 승인된 미리보기 설치 시 전용 내부 네트워크를 한 번 만든다.

   ```powershell
   docker network create --internal ssil-preview-ingress
   ```

3. Windows 작업 스케줄러는 Docker Desktop과 GHCR 읽기 권한을 가진 계정으로 `powershell.exe -NoProfile -File <설치경로>\sync.ps1`을 실행한다. 이 스크립트는 `compose.yml`과 `compose.caddy.yml`을 함께 사용한다. Windows의 `127.0.0.1:8091`로 먼저 로그인과 미리보기 화면을 검증할 수 있다.
4. 운영 Compose에서 **Caddy 서비스에 한해** 기존 네트워크를 유지하면서 외부 `ssil-preview-ingress` 네트워크를 추가한다. 최상위 `networks`에 이름이 `ssil-preview-ingress`인 외부 네트워크를 선언한다. 앱과 운영 PostgreSQL에는 이 네트워크를 붙이지 않는다.
5. 운영 Caddy 설정에 미리보기 호스트 블록을 추가한다. 이 예시의 호스트는 실제로 DNS에 등록된 이름으로 바꾼다. 운영 담당자가 Caddy 설정을 검증한 뒤 반영한다.

   ```caddy
   preview.ssil.khu.ac.kr {
       reverse_proxy ssil-preview-gateway:8080
   }
   ```
