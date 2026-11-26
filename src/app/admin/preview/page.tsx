import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

function previewLink(origin: string | undefined) {
  if (!origin) return null;

  try {
    const url = new URL(origin);
    if (
      url.protocol !== "https:" || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash
    ) return null;
    return new URL("/__ssil_preview", url).href;
  } catch {
    return null;
  }
}

export default function AdminPreviewPage() {
  const href = previewLink(process.env.SSIL_PREVIEW_URL);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">미리보기</h1>
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">변경사항 검토</h2>
        {href ? (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              미리보기 계정으로 로그인한 뒤 PR 번호와 커밋을 확인하고 홈페이지를 열어보세요.
            </p>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              미리보기 열기
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">(새 탭)</span>
            </a>
          </>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            미리보기 환경 주소가 아직 설정되지 않았습니다.
          </p>
        )}
      </section>
    </div>
  );
}
