"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { registerSchema } from "@/lib/validation/auth";

export type RegisterResult =
  | { success: true; role: "CANDIDATE" | "RECRUITER" }
  | { success: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

export async function registerAction(input: unknown): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password, role } = parsed.data;

  // Case-insensitive email check — Postgres unique constraint on `email` is
  // case-sensitive by default, so we normalize here to avoid duplicate
  // accounts differing only by case.
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      role,
      // ADMIN is never self-registered (see registerSchema), so this is
      // always one of the two profile types.
      ...(role === "CANDIDATE"
        ? { candidateProfile: { create: {} } }
        : { recruiterProfile: { create: {} } }),
    },
  });

  return { success: true, role };
}
