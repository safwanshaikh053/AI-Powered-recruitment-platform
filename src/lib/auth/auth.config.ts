import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe subset of the auth config. bcryptjs (used by the credentials
 * provider's authorize()) relies on Node.js APIs that don't exist in the
 * Edge Runtime, so middleware.ts must never load the full config in
 * ./config.ts. This file has no provider, no Prisma adapter — just the
 * session shape, safe to run at the edge for route-guard checks.
 * The full config (providers + adapter) lives in ./config.ts and is only
 * ever imported by Node-runtime route handlers and server actions.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as "CANDIDATE" | "RECRUITER" | "ADMIN";
      }
      return session;
    },
  },
};
