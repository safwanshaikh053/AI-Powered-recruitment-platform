import { auth } from "@/lib/auth";

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

/**
 * Throws if there is no authenticated session. Call this at the top of
 * every server action / route handler that touches non-public data.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError("Not authenticated");
  return session.user;
}

/**
 * Throws if the authenticated user doesn't hold one of the allowed roles.
 * Never trust a role value sent from the client — this always re-derives
 * the role from the server-side session.
 */
export async function requireRole(
  allowed: Array<"CANDIDATE" | "RECRUITER" | "ADMIN">
) {
  const user = await requireAuth();
  if (!allowed.includes(user.role)) {
    throw new ForbiddenError(`Requires role: ${allowed.join(" or ")}`);
  }
  return user;
}
