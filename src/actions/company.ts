"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { companySchema } from "@/lib/validation/company";
import { createCompanyForRecruiter, updateCompanyForRecruiter } from "@/services/company";

function parseCompanyForm(formData: FormData) {
  // logoUrl isn't collected by any form field yet (file upload lands in
  // Phase 7) — deliberately omitted here rather than passed as
  // formData.get("logoUrl"), which would be `null` and fail the schema's
  // `.optional()` check (that only accepts `undefined`, not `null`).
  return companySchema.safeParse({
    name: formData.get("name"),
    website: formData.get("website"),
    industry: formData.get("industry"),
    size: formData.get("size"),
    description: formData.get("description"),
  });
}

function firstFieldError(parsed: { success: false; error: import("zod").ZodError }): string {
  const flat = parsed.error.flatten().fieldErrors;
  const firstField = Object.keys(flat)[0] as keyof typeof flat | undefined;
  return (firstField && flat[firstField]?.[0]) || "Please check your input and try again.";
}

export async function createCompanyAction(formData: FormData) {
  const user = await requireRole(["RECRUITER"]);
  const parsed = parseCompanyForm(formData);
  if (!parsed.success) {
    redirect(`/recruiter?companyError=${encodeURIComponent(firstFieldError(parsed))}`);
  }

  try {
    await createCompanyForRecruiter(user.id, parsed.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    redirect(`/recruiter?companyError=${encodeURIComponent(message)}`);
  }

  revalidatePath("/recruiter");
}

export async function updateCompanyAction(formData: FormData) {
  const user = await requireRole(["RECRUITER"]);
  const parsed = parseCompanyForm(formData);
  if (!parsed.success) {
    redirect(`/recruiter?companyError=${encodeURIComponent(firstFieldError(parsed))}`);
  }

  try {
    await updateCompanyForRecruiter(user.id, parsed.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    redirect(`/recruiter?companyError=${encodeURIComponent(message)}`);
  }

  revalidatePath("/recruiter");
}
