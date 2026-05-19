import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-sm uppercase tracking-[0.3em] text-primary mb-4">
          404
        </p>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-foreground/70 mb-8">
          요청하신 페이지는 이동되었거나 더 이상 존재하지 않습니다.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition"
          >
            Home으로 가기
          </Link>
          <Link
            href="/research"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border hover:bg-foreground/5 transition"
          >
            Research 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
