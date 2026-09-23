"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { applicationSchema, stageChangeSchema } from "@/lib/validation/application";
import { applyToJob, withdrawApplication, changeApplicationStage } from "@/services/application";

export async function applyToJobAction(jobId: string, formData: FormData) {
  const user = await requireRole(["CANDIDATE"]);
  const parsed = applicationSchema.safeParse({ coverLetter: formData.get("coverLetter") });
  if (!parsed.success) {
    redirect(`/jobs/${jobId}?applyError=${encodeURIComponent("Cover letter is too long.")}`);
  }

  let errorMessage: string | null = null;
  try {
    await applyToJob(user.id, jobId, parsed.data.coverLetter);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Something went wrong.";
  }

  if (errorMessage) {
    redirect(`/jobs/${jobId}?applyError=${encodeURIComponent(errorMessage)}`);
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/candidate/applications");
  redirect(`/jobs/${jobId}?applied=true`);
}

export async function withdrawApplicationAction(applicationId: string) {
  const user = await requireRole(["CANDIDATE"]);
  await withdrawApplication(user.id, applicationId);
  revalidatePath("/candidate/applications");
}

export async function changeApplicationStageAction(
  applicationId: string,
  jobId: string,
  formData: FormData
) {
  const user = await requireRole(["RECRUITER"]);
  const parsed = stageChangeSchema.safeParse({
    newStage: formData.get("newStage"),
    note: formData.get("note"),
  });
  if (!parsed.success) return;

  await changeApplicationStage(user.id, applicationId, parsed.data.newStage, parsed.data.note);
  revalidatePath(`/recruiter/jobs/${jobId}/applications`);
}
