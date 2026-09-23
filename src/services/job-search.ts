import { prisma } from "@/lib/db/prisma";

export async function listPublishedJobs(params: { q?: string; location?: string }) {
  const { q, location } = params;

  return prisma.job.findMany({
    where: {
      status: "PUBLISHED",
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(location ? { location: { contains: location, mode: "insensitive" } } : {}),
    },
    include: {
      company: { select: { name: true, logoUrl: true } },
      requiredSkills: { include: { skill: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });
}

/** DRAFT jobs are never visible publicly; CLOSED/CLOSING_SOON stay viewable so a candidate who already applied (or finds an old link) sees an accurate status rather than a 404. */
export async function getPublicJobDetail(jobId: string) {
  return prisma.job.findFirst({
    where: { id: jobId, status: { not: "DRAFT" } },
    include: {
      company: true,
      requiredSkills: { include: { skill: true } },
    },
  });
}
