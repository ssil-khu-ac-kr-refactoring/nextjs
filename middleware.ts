import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// 보호되는 경로에서 세션을 체크.
// API 쓰기 라우트는 각 핸들러에서 requireAdmin()으로 한 번 더 확인하지만,
// 미들웨어에서 1차 차단을 한다.
const PROTECTED_API_PREFIXES = ["/api/admin"];
const PROTECTED_PAGE_PREFIXES = ["/admin"];

function isProtectedPath(pathname: string) {
  return (
    PROTECTED_PAGE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    PROTECTED_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))
  );
}

function safeCallbackUrl(pathnameAndSearch: string): string {
  // 절대 URL 거부, 외부로 새는 // 또는 백슬래시 거부
  if (!pathnameAndSearch.startsWith("/")) return "/admin";
  if (pathnameAndSearch.startsWith("//") || pathnameAndSearch.startsWith("/\\")) return "/admin";
  return pathnameAndSearch;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    // API 보호 경로는 JSON 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const current = safeCallbackUrl(req.nextUrl.pathname + req.nextUrl.search);
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", current);
    return NextResponse.redirect(loginUrl);
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || (token as any).email !== adminEmail) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
