import { z } from "zod";

export const applicationSchema = z.object({
  coverLetter: z.string().max(3000).optional().or(z.literal("")),
});

export const stageChangeSchema = z.object({
  newStage: z.enum([
    "APPLIED",
    "SCREENING",
    "SHORTLISTED",
    "INTERVIEW",
    "OFFER",
    "HIRED",
    "REJECTED",
  ]),
  note: z.string().max(1000).optional().or(z.literal("")),
});

export const jobSearchSchema = z.object({
  q: z.string().max(150).optional(),
  location: z.string().max(150).optional(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
export type StageChangeInput = z.infer<typeof stageChangeSchema>;
