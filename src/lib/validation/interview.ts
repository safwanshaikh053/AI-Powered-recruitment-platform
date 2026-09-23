import { z } from "zod";

export const interviewSchema = z.object({
  scheduledAt: z.string().min(1, "Date/time is required"),
  durationMins: z.coerce.number().min(15).max(480),
  type: z.enum(["TECHNICAL", "HR", "BEHAVIORAL", "FINAL", "OTHER"]),
  meetingLink: z.string().url().optional().or(z.literal("")),
  interviewerEmails: z.string().max(500).optional().or(z.literal("")), // comma-separated
});

export const interviewNoteSchema = z.object({
  content: z.string().min(1, "Note cannot be empty").max(2000),
});

export type InterviewInput = z.infer<typeof interviewSchema>;
