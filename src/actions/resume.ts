"use server";

import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db/prisma";
import { requireCandidateProfileId } from "@/services/candidate-profile";

const utapi = new UTApi();

export async function deleteResumeAction(resumeId: string) {
  const user = await requireRole(["CANDIDATE"]);
  const candidateId = await requireCandidateProfileId(user.id);

  // Ownership check via candidateId, same pattern as every other delete
  // action — never trust the resumeId alone.
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, candidateId },
  });
  if (!resume) return;

  await utapi.deleteFiles(resume.fileKey);
  await prisma.resume.delete({ where: { id: resumeId } });

  revalidatePath("/candidate/profile");
}
