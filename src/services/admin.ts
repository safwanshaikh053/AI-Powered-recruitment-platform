import { prisma } from "@/lib/db/prisma";

export async function getPlatformStats() {
  const [
    totalUsers,
    totalCandidates,
    totalRecruiters,
    totalCompanies,
    pendingCompanies,
    activeJobs,
    totalApplications,
    totalHires,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "CANDIDATE" } }),
    prisma.user.count({ where: { role: "RECRUITER" } }),
    prisma.company.count(),
    prisma.company.count({ where: { status: "PENDING" } }),
    prisma.job.count({ where: { status: "PUBLISHED" } }),
    prisma.application.count(),
    prisma.application.count({ where: { stage: "HIRED" } }),
  ]);

  return {
    totalUsers,
    totalCandidates,
    totalRecruiters,
    totalCompanies,
    pendingCompanies,
    activeJobs,
    totalApplications,
    totalHires,
  };
}

export async function listUsers(filters?: { role?: "CANDIDATE" | "RECRUITER" | "ADMIN" }) {
  return prisma.user.findMany({
    where: filters?.role ? { role: filters.role } : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listCompaniesForModeration() {
  return prisma.company.findMany({
    include: {
      _count: { select: { jobs: true, recruiters: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function listAuditLogs(limit = 50) {
  return prisma.auditLog.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
