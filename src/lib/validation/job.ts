import { z } from "zod";

export const jobSchema = z.object({
  title: z.string().min(3, "Title is required").max(150),
  description: z.string().min(10, "Description is required").max(5000),
  responsibilities: z.string().max(5000).optional().or(z.literal("")),
  requirements: z.string().max(5000).optional().or(z.literal("")),
  minExperienceYears: z.coerce.number().min(0).max(50).optional(),
  educationRequirement: z.string().max(150).optional().or(z.literal("")),
  salaryMin: z.coerce.number().min(0).optional(),
  salaryMax: z.coerce.number().min(0).optional(),
  location: z.string().max(150).optional().or(z.literal("")),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"]),
  workMode: z.enum(["REMOTE", "HYBRID", "ONSITE"]),
  applicationDeadline: z.string().optional().or(z.literal("")),
});

export const jobSkillSchema = z.object({
  skillName: z.string().min(1, "Skill name is required").max(60),
  isPreferred: z.coerce.boolean().optional(),
});

export type JobInput = z.infer<typeof jobSchema>;
export type JobSkillInput = z.infer<typeof jobSkillSchema>;
