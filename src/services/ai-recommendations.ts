import { prisma } from "@/lib/db/prisma";
import { calculateDeterministicMatch, computeAndCacheMatch } from "./ai-matching";

const MAX_JOBS_TO_SCAN = 40;
const TOP_N_RECOMMENDATIONS = 5;
const MIN_SCORE_THRESHOLD = 30;

export async function generateRecommendationsForCandidate(candidateId: string) {
  const candidate = await prisma.candidateProfile.findUniqueOrThrow({
    where: { id: candidateId },
    include: {
      skills: { include: { skill: true } },
      experience: true,
      education: true,
      projects: true,
    },
  });

  const jobs = await prisma.job.findMany({
    where: { status: "PUBLISHED" },
    include: { requiredSkills: { include: { skill: true } } },
    orderBy: { publishedAt: "desc" },
    take: MAX_JOBS_TO_SCAN,
  });

  // Deterministic scoring across every scanned job is cheap (no AI calls);
  // only the top N that clear the bar get an AI-generated explanation and
  // a cached AIAnalysis row — keeps this well within Gemini's free-tier
  // rate limits regardless of how many jobs are on the platform.
  const ranked = jobs
    .map((job) => ({ job, result: calculateDeterministicMatch(candidate, job) }))
    .filter((r) => r.result.score >= MIN_SCORE_THRESHOLD)
    .sort((a, b) => b.result.score - a.result.score)
    .slice(0, TOP_N_RECOMMENDATIONS);

  for (const { job } of ranked) {
    const { score, explanation } = await computeAndCacheMatch({
      candidateId,
      jobId: job.id,
    });

    await prisma.jobRecommendation.upsert({
      where: { candidateId_jobId: { candidateId, jobId: job.id } },
      create: { candidateId, jobId: job.id, score, reason: explanation },
      update: { score, reason: explanation },
    });
  }

  return ranked.length;
}

export async function listRecommendationsForCandidate(candidateId: string) {
  return prisma.jobRecommendation.findMany({
    where: { candidateId },
    include: { job: { include: { company: { select: { name: true } } } } },
    orderBy: { score: "desc" },
  });
}
