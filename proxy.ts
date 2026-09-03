import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { DEMO } from "@/lib/demo";

/**
 * Proxy (voorheen "middleware", hernoemd in Next.js 16).
 * Beschermt het hele dashboard: zonder geldige sessie → /login.
 * Draait op de Node.js-runtime, dus jose werkt hier prima.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Demo: geen inlog. Alles is open en /login bestaat niet meer als bestemming.
  if (DEMO) {
    if (pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isLoginPage = pathname === "/login";

  if (!session && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (session && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Alles behalve Next-interne assets, de auth-API, de cron-route (eigen
  // CRON_SECRET-beveiliging), het publieke intakeformulier (/onboarding/...) en
  // statische bestanden.
  matcher: ["/((?!api/auth|api/cron|onboarding|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
