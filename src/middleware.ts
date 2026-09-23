import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

// Deliberately NOT importing { auth } from "@/lib/auth" here — that pulls
// in the full config (Prisma adapter + bcrypt credentials provider), and
// bcryptjs uses Node APIs unsupported in the Edge Runtime middleware runs
// on. This builds a second, edge-safe NextAuth instance from the
// provider-less config purely for reading/guarding the session.
const { auth } = NextAuth(authConfig);

const ROLE_PREFIXES: Record<string, "CANDIDATE" | "RECRUITER" | "ADMIN"> = {
  "/candidate": "CANDIDATE",
  "/recruiter": "RECRUITER",
  "/admin": "ADMIN",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const matchedPrefix = Object.keys(ROLE_PREFIXES).find((p) =>
    pathname.startsWith(p)
  );

  if (matchedPrefix) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== ROLE_PREFIXES[matchedPrefix]) {
      return NextResponse.redirect(new URL("/forbidden", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

// Note: this middleware only guards navigation/UX. Every server action and
// route handler MUST independently re-check auth + role + ownership —
// middleware is never the sole authorization boundary (see src/lib/permissions).
export const config = {
  matcher: ["/candidate/:path*", "/recruiter/:path*", "/admin/:path*"],
};
