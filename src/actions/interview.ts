"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { interviewSchema, interviewNoteSchema } from "@/lib/validation/interview";
import { scheduleInterview, updateInterview, addInterviewNote } from "@/services/interview";

function firstFieldError(parsed: { success: false; error: import("zod").ZodError }): string {
  const flat = parsed.error.flatten().fieldErrors;
  const firstField = Object.keys(flat)[0] as keyof typeof flat | undefined;
  return (firstField && flat[firstField]?.[0]) || "Please check the interview details.";
}

export async function scheduleInterviewAction(
  applicationId: string,
  jobId: string,
  formData: FormData
) {
  const user = await requireRole(["RECRUITER"]);
  const parsed = interviewSchema.safeParse({
    scheduledAt: formData.get("scheduledAt"),
    durationMins: formData.get("durationMins"),
    type: formData.get("type"),
    meetingLink: formData.get("meetingLink"),
    interviewerEmails: formData.get("interviewerEmails"),
  });
  if (!parsed.success) {
    redirect(
      `/recruiter/jobs/${jobId}/applications?interviewError=${encodeURIComponent(firstFieldError(parsed))}`
    );
  }

  let errorMessage: string | null = null;
  try {
    await scheduleInterview(user.id, applicationId, parsed.data);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Something went wrong.";
  }

  if (errorMessage) {
    redirect(`/recruiter/jobs/${jobId}/applications?interviewError=${encodeURIComponent(errorMessage)}`);
  }

  revalidatePath(`/recruiter/jobs/${jobId}/applications`);
  revalidatePath("/candidate/applications");
}

export async function updateInterviewAction(
  interviewId: string,
  jobId: string,
  formData: FormData
) {
  const user = await requireRole(["RECRUITER"]);
  const parsed = interviewSchema.safeParse({
    scheduledAt: formData.get("scheduledAt"),
    durationMins: formData.get("durationMins"),
    type: formData.get("type"),
    meetingLink: formData.get("meetingLink"),
  });
  if (!parsed.success) {
    redirect(
      `/recruiter/jobs/${jobId}/applications?interviewError=${encodeURIComponent(firstFieldError(parsed))}`
    );
  }

  let errorMessage: string | null = null;
  try {
    await updateInterview(user.id, interviewId, parsed.data);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Something went wrong.";
  }

  if (errorMessage) {
    redirect(`/recruiter/jobs/${jobId}/applications?interviewError=${encodeURIComponent(errorMessage)}`);
  }

  revalidatePath(`/recruiter/jobs/${jobId}/applications`);
  revalidatePath("/candidate/applications");
}

export async function addInterviewNoteAction(
  interviewId: string,
  jobId: string,
  formData: FormData
) {
  const user = await requireRole(["RECRUITER"]);
  const parsed = interviewNoteSchema.safeParse({ content: formData.get("content") });
  if (!parsed.success) return;

  await addInterviewNote(user.id, interviewId, parsed.data.content);
  revalidatePath(`/recruiter/jobs/${jobId}/applications`);
}
