export const siteConfig = {
  name: "Recruitment Platform",
  description: "AI-powered recruitment and talent management platform",
  roles: ["CANDIDATE", "RECRUITER", "ADMIN"] as const,
};

// Match-score weights (Phase 8). Kept centralized and configurable rather
// than hardcoded inside the matching engine.
export const matchWeights = {
  skills: 0.4,
  experience: 0.25,
  education: 0.1,
  projects: 0.15,
  preferredSkills: 0.1,
};
