"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { jobSchema, jobSkillSchema } from "@/lib/validation/job";
import {
  createJob,
  updateJob,
  publishJob,
  unpublishJob,
  markJobClosingSoon,
  closeJob,
  addRequiredSkill,
  removeRequiredSkill,
} from "@/services/job";

function parseJobForm(formData: FormData) {
  return jobSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    responsibilities: formData.get("responsibilities"),
    requirements: formData.get("requirements"),
    minExperienceYears: formData.get("minExperienceYears") || undefined,
    educationRequirement: formData.get("educationRequirement"),
    salaryMin: formData.get("salaryMin") || undefined,
    salaryMax: formData.get("salaryMax") || undefined,
    location: formData.get("location"),
    employmentType: formData.get("employmentType"),
    workMode: formData.get("workMode"),
    applicationDeadline: formData.get("applicationDeadline"),
  });
}

export async function createJobAction(formData: FormData) {
  const user = await requireRole(["RECRUITER"]);
  const parsed = parseJobForm(formData);
  if (!parsed.success) return;

  const job = await createJob(user.id, parsed.data);
  revalidatePath("/recruiter");
  redirect(`/recruiter/jobs/${job.id}`);
}

export async function updateJobAction(jobId: string, formData: FormData) {
  const user = await requireRole(["RECRUITER"]);
  const parsed = parseJobForm(formData);
  if (!parsed.success) return;

  await updateJob(user.id, jobId, parsed.data);
  revalidatePath(`/recruiter/jobs/${jobId}`);
}

export async function publishJobAction(jobId: string) {
  const user = await requireRole(["RECRUITER"]);
  await publishJob(user.id, jobId);
  revalidatePath(`/recruiter/jobs/${jobId}`);
  revalidatePath("/recruiter");
}

export async function unpublishJobAction(jobId: string) {
  const user = await requireRole(["RECRUITER"]);
  await unpublishJob(user.id, jobId);
  revalidatePath(`/recruiter/jobs/${jobId}`);
  revalidatePath("/recruiter");
}

export async function markJobClosingSoonAction(jobId: string) {
  const user = await requireRole(["RECRUITER"]);
  await markJobClosingSoon(user.id, jobId);
  revalidatePath(`/recruiter/jobs/${jobId}`);
  revalidatePath("/recruiter");
}

export async function closeJobAction(jobId: string) {
  const user = await requireRole(["RECRUITER"]);
  await closeJob(user.id, jobId);
  revalidatePath(`/recruiter/jobs/${jobId}`);
  revalidatePath("/recruiter");
}

export async function addJobSkillAction(jobId: string, formData: FormData) {
  const user = await requireRole(["RECRUITER"]);
  const parsed = jobSkillSchema.safeParse({
    skillName: formData.get("skillName"),
    isPreferred: formData.get("isPreferred") === "on",
  });
  if (!parsed.success) return;

  await addRequiredSkill(user.id, jobId, parsed.data.skillName, !!parsed.data.isPreferred);
  revalidatePath(`/recruiter/jobs/${jobId}`);
}

export async function removeJobSkillAction(jobId: string, jobSkillId: string) {
  const user = await requireRole(["RECRUITER"]);
  await removeRequiredSkill(user.id, jobId, jobSkillId);
  revalidatePath(`/recruiter/jobs/${jobId}`);
}
