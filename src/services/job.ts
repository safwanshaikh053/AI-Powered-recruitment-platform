import { prisma } from "@/lib/db/prisma";
import { uniqueSlug } from "@/lib/utils/slugify";
import type { JobInput } from "@/lib/validation/job";

/** Every job mutation goes through this first — throws if the job doesn't exist or doesn't belong to this recruiter's company, so a recruiter can never touch another company's job even with a hand-crafted request. */
async function requireOwnedJob(userId: string, jobId: string) {
  const recruiter = await prisma.recruiterProfile.findUnique({ where: { userId } });
  if (!recruiter?.companyId) throw new Error("No company associated with this account.");

  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId: recruiter.companyId },
  });
  if (!job) throw new Error("Job not found or you don't have access to it.");

  return { job, recruiter };
}

export async function listJobsForRecruiter(userId: string) {
  const recruiter = await prisma.recruiterProfile.findUnique({ where: { userId } });
  if (!recruiter?.companyId) return [];

  return prisma.job.findMany({
    where: { companyId: recruiter.companyId },
    include: { _count: { select: { applications: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getJobForRecruiter(userId: string, jobId: string) {
  const { job } = await requireOwnedJob(userId, jobId);
  return prisma.job.findUnique({
    where: { id: job.id },
    include: {
      requiredSkills: { include: { skill: true } },
      _count: { select: { applications: true } },
    },
  });
}

function toJobData(input: JobInput) {
  return {
    title: input.title,
    description: input.description,
    responsibilities: input.responsibilities || null,
    requirements: input.requirements || null,
    minExperienceYears: input.minExperienceYears ?? null,
    educationRequirement: input.educationRequirement || null,
    salaryMin: input.salaryMin ?? null,
    salaryMax: input.salaryMax ?? null,
    location: input.location || null,
    employmentType: input.employmentType,
    workMode: input.workMode,
    applicationDeadline: input.applicationDeadline ? new Date(input.applicationDeadline) : null,
  };
}

export async function createJob(userId: string, input: JobInput) {
  const recruiter = await prisma.recruiterProfile.findUnique({ where: { userId } });
  if (!recruiter?.companyId) throw new Error("You need a company before posting jobs.");

  return prisma.job.create({
    data: {
      ...toJobData(input),
      slug: uniqueSlug(input.title),
      companyId: recruiter.companyId,
      recruiterId: recruiter.id,
      status: "DRAFT",
    },
  });
}

export async function updateJob(userId: string, jobId: string, input: JobInput) {
  await requireOwnedJob(userId, jobId);
  return prisma.job.update({
    where: { id: jobId },
    data: toJobData(input),
  });
}

export async function publishJob(userId: string, jobId: string) {
  const { job } = await requireOwnedJob(userId, jobId);
  if (job.status !== "DRAFT") throw new Error("Only draft jobs can be published.");

  return prisma.job.update({
    where: { id: jobId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
}

export async function unpublishJob(userId: string, jobId: string) {
  const { job } = await requireOwnedJob(userId, jobId);
  if (job.status !== "PUBLISHED") throw new Error("Only published jobs can be unpublished.");

  return prisma.job.update({
    where: { id: jobId },
    data: { status: "DRAFT" },
  });
}

export async function markJobClosingSoon(userId: string, jobId: string) {
  const { job } = await requireOwnedJob(userId, jobId);
  if (job.status !== "PUBLISHED") {
    throw new Error("Only published jobs can be marked as closing soon.");
  }

  return prisma.job.update({
    where: { id: jobId },
    data: { status: "CLOSING_SOON" },
  });
}

export async function closeJob(userId: string, jobId: string) {
  const { job } = await requireOwnedJob(userId, jobId);
  if (job.status !== "PUBLISHED" && job.status !== "CLOSING_SOON") {
    throw new Error("Only published jobs can be closed.");
  }

  return prisma.job.update({
    where: { id: jobId },
    data: { status: "CLOSED", closedAt: new Date() },
  });
}

export async function addRequiredSkill(
  userId: string,
  jobId: string,
  skillName: string,
  isPreferred: boolean
) {
  await requireOwnedJob(userId, jobId);

  const skill = await prisma.skill.upsert({
    where: { name: skillName },
    create: { name: skillName },
    update: {},
  });

  return prisma.jobSkill.upsert({
    where: { jobId_skillId: { jobId, skillId: skill.id } },
    create: { jobId, skillId: skill.id, isPreferred },
    update: { isPreferred },
  });
}

export async function removeRequiredSkill(userId: string, jobId: string, jobSkillId: string) {
  await requireOwnedJob(userId, jobId);
  await prisma.jobSkill.deleteMany({ where: { id: jobSkillId, jobId } });
}
