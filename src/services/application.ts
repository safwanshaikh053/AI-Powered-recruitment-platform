import { prisma } from "@/lib/db/prisma";
import type { ApplicationStage } from "@prisma/client";

// --- Candidate side ----------------------------------------------------

export async function getCandidateApplicationForJob(userId: string, jobId: string) {
  const candidate = await prisma.candidateProfile.findUnique({ where: { userId } });
  if (!candidate) return null;

  return prisma.application.findUnique({
    where: { jobId_candidateId: { jobId, candidateId: candidate.id } },
  });
}

export async function applyToJob(
  userId: string,
  jobId: string,
  coverLetter: string | undefined
) {
  const candidate = await prisma.candidateProfile.findUnique({ where: { userId } });
  if (!candidate) throw new Error("Candidate profile not found.");

  const job = await prisma.job.findFirst({
    where: { id: jobId, status: { in: ["PUBLISHED", "CLOSING_SOON"] } },
  });
  if (!job) throw new Error("This job is not accepting applications.");

  const existing = await prisma.application.findUnique({
    where: { jobId_candidateId: { jobId, candidateId: candidate.id } },
  });
  if (existing) throw new Error("You've already applied to this job.");

  const activeResume = await prisma.resume.findFirst({
    where: { candidateId: candidate.id, isActive: true },
    select: { id: true },
  });

  const application = await prisma.application.create({
    data: {
      jobId,
      candidateId: candidate.id,
      coverLetter: coverLetter || null,
      resumeId: activeResume?.id,
      stage: "APPLIED",
    },
  });

  await prisma.applicationStatusHistory.create({
    data: {
      applicationId: application.id,
      previousStage: null,
      newStage: "APPLIED",
      changedById: userId,
      note: "Application submitted",
    },
  });

  // Notify the recruiter who owns the job. The notification is written now
  // so the data model is exercised end to end; a UI to read/mark-read
  // notifications lands in Phase 9.
  const recruiter = await prisma.recruiterProfile.findUniqueOrThrow({
    where: { id: job.recruiterId },
  });
  await prisma.notification.create({
    data: {
      userId: recruiter.userId,
      type: "NEW_APPLICATION",
      title: "New application received",
      message: `A candidate applied to ${job.title}.`,
    },
  });

  return application;
}

export async function listApplicationsForCandidate(userId: string) {
  const candidate = await prisma.candidateProfile.findUnique({ where: { userId } });
  if (!candidate) return [];

  return prisma.application.findMany({
    where: { candidateId: candidate.id },
    include: {
      job: { include: { company: { select: { name: true } } } },
      interviews: { orderBy: { scheduledAt: "asc" } },
      statusHistory: {
        include: { changedBy: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { appliedAt: "desc" },
  });
}

export async function withdrawApplication(userId: string, applicationId: string) {
  const candidate = await prisma.candidateProfile.findUnique({ where: { userId } });
  if (!candidate) throw new Error("Candidate profile not found.");

  const application = await prisma.application.findFirst({
    where: { id: applicationId, candidateId: candidate.id },
  });
  if (!application) throw new Error("Application not found.");
  if (application.stage !== "APPLIED") {
    throw new Error("Only applications still in the Applied stage can be withdrawn.");
  }

  // Hard delete rather than a WITHDRAWN status — the schema's
  // ApplicationStage enum doesn't include one, and withdrawing before
  // screening has even started is cleanly modeled as "never happened"
  // rather than reusing REJECTED (which would misrepresent the recruiter
  // as having made a rejection decision they never made).
  await prisma.application.delete({ where: { id: applicationId } });
}

// --- Recruiter side ------------------------------------------------------

async function requireRecruiterOwnsJob(userId: string, jobId: string) {
  const recruiter = await prisma.recruiterProfile.findUnique({ where: { userId } });
  if (!recruiter?.companyId) throw new Error("No company associated with this account.");

  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId: recruiter.companyId },
  });
  if (!job) throw new Error("Job not found or you don't have access to it.");

  return { job, recruiter };
}

export async function listApplicationsForJob(userId: string, jobId: string) {
  await requireRecruiterOwnsJob(userId, jobId);

  return prisma.application.findMany({
    where: { jobId },
    include: {
      candidate: {
        include: {
          user: { select: { name: true, email: true } },
          skills: { include: { skill: true } },
          education: true,
          experience: true,
        },
      },
      resume: { select: { fileUrl: true, fileName: true } },
      aiAnalysis: true,
      interviews: {
        include: {
          participants: { include: { user: { select: { name: true, email: true } } } },
          notes: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
        },
        orderBy: { scheduledAt: "asc" },
      },
      statusHistory: {
        include: { changedBy: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { appliedAt: "desc" },
  });
}

/**
 * Forward-only pipeline plus REJECTED as an escape hatch from any active
 * stage. HIRED and REJECTED are terminal. Documented here rather than left
 * implicit — this is the one place that decides what stage jumps are legal.
 */
const ALLOWED_TRANSITIONS: Record<ApplicationStage, ApplicationStage[]> = {
  APPLIED: ["SCREENING", "SHORTLISTED", "REJECTED"],
  SCREENING: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["OFFER", "REJECTED"],
  OFFER: ["HIRED", "REJECTED"],
  HIRED: [],
  REJECTED: [],
};

export function getAllowedNextStages(currentStage: ApplicationStage): ApplicationStage[] {
  return ALLOWED_TRANSITIONS[currentStage];
}

export async function changeApplicationStage(
  recruiterUserId: string,
  applicationId: string,
  newStage: ApplicationStage,
  note: string | undefined
) {
  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application) throw new Error("Application not found.");

  await requireRecruiterOwnsJob(recruiterUserId, application.jobId);

  const allowed = ALLOWED_TRANSITIONS[application.stage];
  if (!allowed.includes(newStage)) {
    throw new Error(`Cannot move an application from ${application.stage} to ${newStage}.`);
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: { stage: newStage },
  });

  await prisma.applicationStatusHistory.create({
    data: {
      applicationId,
      previousStage: application.stage,
      newStage,
      changedById: recruiterUserId,
      note: note || null,
    },
  });

  const candidate = await prisma.candidateProfile.findUniqueOrThrow({
    where: { id: application.candidateId },
  });
  await prisma.notification.create({
    data: {
      userId: candidate.userId,
      type: newStage === "SHORTLISTED" ? "SHORTLISTED" : "APPLICATION_STATUS_CHANGED",
      title: "Application status updated",
      message: `Your application status changed to ${newStage.toLowerCase()}.`,
    },
  });
}
