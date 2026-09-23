"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { requireCandidateProfileId } from "@/services/candidate-profile";
import { computeAndCacheMatch } from "@/services/ai-matching";
import { prisma } from "@/lib/db/prisma";

export async function calculateJobMatchAction(jobId: string) {
  const user = await requireRole(["CANDIDATE"]);
  const candidateId = await requireCandidateProfileId(user.id);
  await computeAndCacheMatch({ candidateId, jobId });
  revalidatePath(`/jobs/${jobId}`);
}

// Capped so one click can't fire dozens of AI calls in a row and blow
// through Gemini's free-tier rate limit — recruiters with more applicants
// than this can click again to cover more (already-cached ones are cheap
// no-op recomputations, not a blocker).
const MAX_BULK = 10;

export async function calculateApplicantMatchesAction(jobId: string) {
  const user = await requireRole(["RECRUITER"]);

  const recruiter = await prisma.recruiterProfile.findUnique({ where: { userId: user.id } });
  if (!recruiter?.companyId) return;

  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId: recruiter.companyId },
  });
  if (!job) return;

  const applications = await prisma.application.findMany({
    where: { jobId },
    select: { id: true, candidateId: true },
    take: MAX_BULK,
  });

  for (const app of applications) {
    await computeAndCacheMatch({
      candidateId: app.candidateId,
      jobId,
      applicationId: app.id,
    });
  }

  revalidatePath(`/recruiter/jobs/${jobId}/applications`);
}
