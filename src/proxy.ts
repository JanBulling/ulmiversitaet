import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "./lib/auth/token";
import { routing } from "./lib/i18n/routing";

const intl = createMiddleware(routing);

/** `/admin/...` or `/en/admin/...`, captures the locale prefix and the sub path */
const ADMIN_PATH = /^(\/en)?\/admin(\/.*)?$/;

export default async function proxy(request: NextRequest) {
  // Optimistic check: send visitors without a valid session to the login page.
  // Pages and Server Actions verify the session again (`requireAdmin`).
  const admin = request.nextUrl.pathname.match(ADMIN_PATH);
  if (admin && admin[2] !== "/login") {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!(await verifySessionToken(token))) {
      return NextResponse.redirect(
        new URL(`${admin[1] ?? ""}/admin/login`, request.url),
      );
    }
  }

  return intl(request);
}

export const config = {
  // Skip API routes, Next.js internals, Vercel internals, files with an extension, and Open Graph
  // images (Next.js links them with the locale, e.g. `/de/opengraph-image`, which must not redirect)
  matcher: "/((?!api|_next|_vercel|.*opengraph-image|.*\\..*).*)",
};
