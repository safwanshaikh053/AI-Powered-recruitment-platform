import { prisma } from "@/lib/db/prisma";

/**
 * Profile completion weights. Kept centralized and documented rather than
 * scattered magic numbers — matches the "configurable scoring" approach
 * used for AI match weights in src/config/site.ts.
 */
const COMPLETION_WEIGHTS = {
  personalInfo: 20, // phone + location + bio all present
  skills: 20, // at least 3 skills
  education: 20, // at least 1 entry
  experience: 20, // at least 1 entry
  projects: 20, // at least 1 entry
};

export async function getFullCandidateProfile(userId: string) {
  return prisma.candidateProfile.findUnique({
    where: { userId },
    include: {
      skills: { include: { skill: true }, orderBy: { id: "desc" } },
      education: { orderBy: { startDate: "desc" } },
      experience: { orderBy: { startDate: "desc" } },
      projects: { orderBy: { createdAt: "desc" } },
      certifications: { orderBy: { issueDate: "desc" } },
      resumes: { where: { isActive: true }, take: 1 },
    },
  });
}

/** Every profile mutation goes through this to get the candidateProfile id from the userId, throwing a clear error if the profile is somehow missing (it shouldn't be — created atomically at registration). */
export async function requireCandidateProfileId(userId: string): Promise<string> {
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) {
    throw new Error("Candidate profile not found for this user.");
  }
  return profile.id;
}

export async function recalculateProfileCompletion(candidateId: string) {
  const profile = await prisma.candidateProfile.findUniqueOrThrow({
    where: { id: candidateId },
    include: {
      skills: true,
      education: true,
      experience: true,
      projects: true,
    },
  });

  let score = 0;
  if (profile.phone && profile.location && profile.bio) {
    score += COMPLETION_WEIGHTS.personalInfo;
  }
  if (profile.skills.length >= 3) score += COMPLETION_WEIGHTS.skills;
  if (profile.education.length >= 1) score += COMPLETION_WEIGHTS.education;
  if (profile.experience.length >= 1) score += COMPLETION_WEIGHTS.experience;
  if (profile.projects.length >= 1) score += COMPLETION_WEIGHTS.projects;

  await prisma.candidateProfile.update({
    where: { id: candidateId },
    data: { profileCompletion: score },
  });

  return score;
}

function parseCommaList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export { parseCommaList };
