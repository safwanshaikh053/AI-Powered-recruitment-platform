import type { NextAuthConfig } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/validation/auth";
import { authConfig } from "./auth.config";

// next-auth bundles its own copy of @auth/core, separate from the one
// @auth/prisma-adapter resolves against. They're the same shape at runtime,
// but TypeScript treats them as distinct types — hence the cast below.

/**
 * Full Auth.js config — Prisma adapter + bcrypt-based credentials provider.
 * This must ONLY be imported from Node-runtime code (route handlers, server
 * actions, server components) — never from middleware.ts, which runs on
 * the Edge Runtime where bcryptjs's Node APIs aren't available. Middleware
 * uses the edge-safe subset in ./auth.config.ts instead.
 */
export const fullAuthConfig: NextAuthConfig = {
  ...authConfig,
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;
        if (user.status !== "ACTIVE") return null;

        const validPassword = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!validPassword) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
  },
};
