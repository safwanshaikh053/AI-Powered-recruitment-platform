import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(2, "Company name is required").max(150),
  website: z.string().url().optional().or(z.literal("")),
  industry: z.string().max(100).optional().or(z.literal("")),
  size: z.string().max(50).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

export type CompanyInput = z.infer<typeof companySchema>;
