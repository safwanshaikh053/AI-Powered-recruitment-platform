import { prisma } from "@/lib/db/prisma";
import { uniqueSlug } from "@/lib/utils/slugify";
import type { CompanyInput } from "@/lib/validation/company";

export async function getRecruiterProfileWithCompany(userId: string) {
  return prisma.recruiterProfile.findUnique({
    where: { userId },
    include: { company: true },
  });
}

/** Creates a company and attaches the calling recruiter to it. New companies start PENDING pending admin approval (see Company.status in schema). */
export async function createCompanyForRecruiter(userId: string, input: CompanyInput) {
  const recruiter = await prisma.recruiterProfile.findUnique({ where: { userId } });
  if (!recruiter) throw new Error("Recruiter profile not found.");
  if (recruiter.companyId) throw new Error("You already belong to a company.");

  const company = await prisma.company.create({
    data: {
      name: input.name,
      slug: uniqueSlug(input.name),
      website: input.website || null,
      industry: input.industry || null,
      size: input.size || null,
      description: input.description || null,
      logoUrl: input.logoUrl || null,
    },
  });

  await prisma.recruiterProfile.update({
    where: { userId },
    data: { companyId: company.id },
  });

  return company;
}

/** Only updates the company if the calling recruiter actually belongs to it — the ownership check that prevents editing another company's profile. */
export async function updateCompanyForRecruiter(userId: string, input: CompanyInput) {
  const recruiter = await prisma.recruiterProfile.findUnique({ where: { userId } });
  if (!recruiter?.companyId) throw new Error("No company to update.");

  return prisma.company.update({
    where: { id: recruiter.companyId },
    data: {
      name: input.name,
      website: input.website || null,
      industry: input.industry || null,
      size: input.size || null,
      description: input.description || null,
      logoUrl: input.logoUrl || null,
    },
  });
}
