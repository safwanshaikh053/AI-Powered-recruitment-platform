import { prisma } from "@/lib/db/prisma";
import { getAIProvider } from "@/lib/ai/provider";

/**
 * Scoring weights — documented and centralized per the brief's requirement
 * that match scoring not be an AI black box. AI is used only to generate
 * the human-readable "why", never to move these numbers.
 */
const WEIGHTS = {
  skills: 40,
  experience: 25,
  education: 10,
  projects: 15,
  preferredSkills: 10,
};

interface CandidateForMatch {
  skills: { skill: { name: string } }[];
  experience: { startDate: Date; endDate: Date | null; isCurrent: boolean }[];
  education: { degree: string; field: string }[];
  projects: { technologies: string[] }[];
}

interface JobForMatch {
  requiredSkills: { skill: { name: string }; isPreferred: boolean }[];
  minExperienceYears: number | null;
  educationRequirement: string | null;
}

interface DeterministicResult {
  score: number;
  matchingSkills: string[];
  missingSkills: string[];
  partialSkills: string[]; // matched preferred (nice-to-have) skills
  totalYearsExperience: number;
}

function yearsBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

export function calculateDeterministicMatch(
  candidate: CandidateForMatch,
  job: JobForMatch
): DeterministicResult {
  const requiredSkills = job.requiredSkills.filter((js) => !js.isPreferred);
  const preferredSkills = job.requiredSkills.filter((js) => js.isPreferred);
  const candidateSkillNames = new Set(
    candidate.skills.map((cs) => cs.skill.name.toLowerCase())
  );

  const matchedRequired = requiredSkills.filter((js) =>
    candidateSkillNames.has(js.skill.name.toLowerCase())
  );
  const missingRequired = requiredSkills.filter(
    (js) => !candidateSkillNames.has(js.skill.name.toLowerCase())
  );
  const matchedPreferred = preferredSkills.filter((js) =>
    candidateSkillNames.has(js.skill.name.toLowerCase())
  );

  const skillsScore = requiredSkills.length
    ? (matchedRequired.length / requiredSkills.length) * WEIGHTS.skills
    : WEIGHTS.skills;

  const preferredScore = preferredSkills.length
    ? (matchedPreferred.length / preferredSkills.length) * WEIGHTS.preferredSkills
    : WEIGHTS.preferredSkills;

  const totalYearsExperience = candidate.experience.reduce((sum, exp) => {
    const end = exp.isCurrent ? new Date() : exp.endDate ?? new Date();
    return sum + Math.max(0, yearsBetween(exp.startDate, end));
  }, 0);

  const experienceScore = job.minExperienceYears
    ? Math.min(1, totalYearsExperience / job.minExperienceYears) * WEIGHTS.experience
    : WEIGHTS.experience;

  let educationScore: number;
  if (job.educationRequirement) {
    const req = job.educationRequirement.toLowerCase();
    const hasMatch = candidate.education.some(
      (ed) =>
        req.includes(ed.degree.toLowerCase()) ||
        req.includes(ed.field.toLowerCase()) ||
        ed.degree.toLowerCase().includes(req) ||
        ed.field.toLowerCase().includes(req)
    );
    educationScore = hasMatch ? WEIGHTS.education : candidate.education.length ? WEIGHTS.education * 0.5 : 0;
  } else {
    educationScore = WEIGHTS.education; // not required — don't penalize
  }

  const allJobSkillNames = new Set(
    job.requiredSkills.map((js) => js.skill.name.toLowerCase())
  );
  const hasRelevantProject = candidate.projects.some((p) =>
    p.technologies.some((t) => allJobSkillNames.has(t.toLowerCase()))
  );
  const projectsScore = hasRelevantProject
    ? WEIGHTS.projects
    : candidate.projects.length
      ? WEIGHTS.projects * 0.5
      : 0;

  const score = Math.round(
    skillsScore + preferredScore + experienceScore + educationScore + projectsScore
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    matchingSkills: matchedRequired.map((js) => js.skill.name),
    missingSkills: missingRequired.map((js) => js.skill.name),
    partialSkills: matchedPreferred.map((js) => js.skill.name),
    totalYearsExperience: Math.round(totalYearsExperience * 10) / 10,
  };
}

async function generateExplanation(
  jobTitle: string,
  result: DeterministicResult
): Promise<string> {
  try {
    const ai = getAIProvider();
    const text = await ai.complete({
      system:
        "You explain job-candidate match scores in 1-2 plain sentences for a recruitment platform. Be specific and factual, no fluff, no markdown.",
      prompt: `Job: ${jobTitle}
Match score: ${result.score}/100
Matching required skills: ${result.matchingSkills.join(", ") || "none"}
Missing required skills: ${result.missingSkills.join(", ") || "none"}
Candidate experience: ${result.totalYearsExperience} years

Write a short, factual explanation of this match.`,
      maxTokens: 150,
    });
    return text.trim();
  } catch (err) {
    // AI is explanatory sugar on top of a deterministic score — its
    // unavailability (rate limit, missing key, network) must never break
    // the matching feature itself.
    console.error("AI explanation generation failed:", err);
    const missingText = result.missingSkills.length
      ? `Missing: ${result.missingSkills.join(", ")}.`
      : "All required skills are present.";
    return `${result.matchingSkills.length}/${result.matchingSkills.length + result.missingSkills.length} required skills matched. ${missingText}`;
  }
}

async function fetchCandidateForMatch(candidateId: string) {
  return prisma.candidateProfile.findUniqueOrThrow({
    where: { id: candidateId },
    include: {
      skills: { include: { skill: true } },
      experience: true,
      education: true,
      projects: true,
    },
  });
}

async function fetchJobForMatch(jobId: string) {
  return prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: { requiredSkills: { include: { skill: true } } },
  });
}

export async function computeAndCacheMatch(params: {
  candidateId: string;
  jobId: string;
  applicationId?: string;
}): Promise<DeterministicResult & { explanation: string }> {
  const [candidate, job] = await Promise.all([
    fetchCandidateForMatch(params.candidateId),
    fetchJobForMatch(params.jobId),
  ]);

  const result = calculateDeterministicMatch(candidate, job);
  const explanation = await generateExplanation(job.title, result);

  const data = {
    matchScore: result.score,
    matchingSkills: result.matchingSkills,
    missingSkills: result.missingSkills,
    partialSkills: result.partialSkills,
    explanation,
  };

  if (params.applicationId) {
    // Application exists — AIAnalysis.applicationId is unique, so a clean upsert.
    await prisma.aIAnalysis.upsert({
      where: { applicationId: params.applicationId },
      create: {
        applicationId: params.applicationId,
        candidateId: params.candidateId,
        jobId: params.jobId,
        ...data,
      },
      update: data,
    });
  } else {
    // No application yet (candidate previewing a job) — no unique
    // constraint spans candidateId+jobId alone, so find-then-write.
    const existing = await prisma.aIAnalysis.findFirst({
      where: { candidateId: params.candidateId, jobId: params.jobId, applicationId: null },
      select: { id: true },
    });
    if (existing) {
      await prisma.aIAnalysis.update({ where: { id: existing.id }, data });
    } else {
      await prisma.aIAnalysis.create({
        data: { candidateId: params.candidateId, jobId: params.jobId, ...data },
      });
    }
  }

  return { ...result, explanation };
}

export async function getCachedMatch(candidateId: string, jobId: string) {
  return prisma.aIAnalysis.findFirst({
    where: { candidateId, jobId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCachedMatchForUser(userId: string, jobId: string) {
  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!candidate) return null;
  return getCachedMatch(candidate.id, jobId);
}
