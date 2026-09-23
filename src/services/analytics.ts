import { subDays, format } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import type { ApplicationStage } from "@prisma/client";

const STAGES: ApplicationStage[] = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFER",
  "HIRED",
];

/** Buckets a list of timestamps into daily counts over the trailing N days, filling in zero-count days so the chart doesn't have gaps. */
function bucketByDay(dates: Date[], days = 30) {
  const cutoff = subDays(new Date(), days - 1);
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    buckets.set(format(subDays(new Date(), days - 1 - i), "MMM d"), 0);
  }
  for (const date of dates) {
    if (date < cutoff) continue;
    const key = format(date, "MMM d");
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

function buildFunnel(applications: { stage: ApplicationStage }[]) {
  return STAGES.map((stage) => ({
    stage,
    count: applications.filter((a) => a.stage === stage).length,
  }));
}

export async function getRecruiterAnalytics(userId: string) {
  const recruiter = await prisma.recruiterProfile.findUnique({ where: { userId } });
  if (!recruiter?.companyId) return null;

  const jobs = await prisma.job.findMany({
    where: { companyId: recruiter.companyId },
    select: {
      id: true,
      title: true,
      status: true,
      _count: { select: { applications: true } },
    },
  });
  const jobIds = jobs.map((j) => j.id);

  const applications = await prisma.application.findMany({
    where: { jobId: { in: jobIds } },
    select: { stage: true, appliedAt: true },
  });

  return {
    activeJobs: jobs.filter((j) => j.status === "PUBLISHED").length,
    totalApplications: applications.length,
    shortlisted: applications.filter((a) => a.stage === "SHORTLISTED").length,
    interviews: applications.filter((a) => a.stage === "INTERVIEW").length,
    offers: applications.filter((a) => a.stage === "OFFER").length,
    hires: applications.filter((a) => a.stage === "HIRED").length,
    funnel: buildFunnel(applications),
    applicationsOverTime: bucketByDay(applications.map((a) => a.appliedAt)),
    jobsPerformance: jobs
      .map((j) => ({ title: j.title, applications: j._count.applications }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 8),
  };
}

export async function getAdminAnalytics() {
  const [users, jobs, applications] = await Promise.all([
    prisma.user.findMany({ select: { createdAt: true } }),
    prisma.job.findMany({ select: { createdAt: true } }),
    prisma.application.findMany({ select: { appliedAt: true, stage: true } }),
  ]);

  return {
    userGrowth: bucketByDay(users.map((u) => u.createdAt)),
    jobGrowth: bucketByDay(jobs.map((j) => j.createdAt)),
    applicationGrowth: bucketByDay(applications.map((a) => a.appliedAt)),
    funnel: buildFunnel(applications),
  };
}

export async function getCandidateStats(userId: string) {
  const candidate = await prisma.candidateProfile.findUnique({ where: { userId } });
  if (!candidate) return null;

  const applications = await prisma.application.findMany({
    where: { candidateId: candidate.id },
    select: { stage: true },
  });

  return {
    total: applications.length,
    shortlisted: applications.filter((a) => a.stage === "SHORTLISTED").length,
    interviews: applications.filter((a) => a.stage === "INTERVIEW").length,
    offers: applications.filter((a) => a.stage === "OFFER").length,
  };
}
