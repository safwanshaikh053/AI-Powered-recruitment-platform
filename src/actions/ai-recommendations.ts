"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { requireCandidateProfileId } from "@/services/candidate-profile";
import { generateRecommendationsForCandidate } from "@/services/ai-recommendations";

export async function refreshRecommendationsAction() {
  const user = await requireRole(["CANDIDATE"]);
  const candidateId = await requireCandidateProfileId(user.id);
  await generateRecommendationsForCandidate(candidateId);
  revalidatePath("/candidate");
}
