import { z } from "zod";

export const personalInfoSchema = z.object({
  phone: z.string().max(20).optional().or(z.literal("")),
  location: z.string().max(120).optional().or(z.literal("")),
  bio: z.string().max(1000).optional().or(z.literal("")),
});

export const skillSchema = z.object({
  skillName: z.string().min(1, "Skill name is required").max(60),
  proficiency: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
  yearsOfExperience: z.coerce.number().min(0).max(50),
});

export const educationSchema = z.object({
  institution: z.string().min(1, "Institution is required").max(150),
  degree: z.string().min(1, "Degree is required").max(150),
  field: z.string().min(1, "Field of study is required").max(150),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().or(z.literal("")),
  grade: z.string().max(50).optional().or(z.literal("")),
});

export const experienceSchema = z.object({
  company: z.string().min(1, "Company is required").max(150),
  position: z.string().min(1, "Position is required").max(150),
  description: z.string().max(2000).optional().or(z.literal("")),
  skillsUsed: z.string().max(500).optional().or(z.literal("")), // comma-separated
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().or(z.literal("")),
  isCurrent: z.coerce.boolean().optional(),
});

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(150),
  description: z.string().max(2000).optional().or(z.literal("")),
  technologies: z.string().max(500).optional().or(z.literal("")), // comma-separated
  projectUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
});

export const certificationSchema = z.object({
  name: z.string().min(1, "Certification name is required").max(150),
  issuer: z.string().min(1, "Issuer is required").max(150),
  issueDate: z.string().min(1, "Issue date is required"),
  credentialUrl: z.string().url().optional().or(z.literal("")),
});

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type SkillInput = z.infer<typeof skillSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type CertificationInput = z.infer<typeof certificationSchema>;
