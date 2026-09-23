"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db/prisma";
import {
  personalInfoSchema,
  skillSchema,
  educationSchema,
  experienceSchema,
  projectSchema,
  certificationSchema,
} from "@/lib/validation/candidate-profile";
import {
  requireCandidateProfileId,
  recalculateProfileCompletion,
  parseCommaList,
} from "@/services/candidate-profile";

const PROFILE_PATH = "/candidate/profile";

// Every action below re-derives the candidateId from the authenticated
// session (never from a client-submitted field) — this is what prevents a
// candidate from editing another candidate's profile even if they craft
// the request by hand.

export async function updatePersonalInfoAction(formData: FormData) {
  const user = await requireRole(["CANDIDATE"]);
  const candidateId = await requireCandidateProfileId(user.id);

  const parsed = personalInfoSchema.safeParse({
    phone: formData.get("phone"),
    location: formData.get("location"),
    bio: formData.get("bio"),
  });
  if (!parsed.success) return;

  await prisma.candidateProfile.update({
    where: { id: candidateId },
    data: parsed.data,
  });
  await recalculateProfileCompletion(candidateId);
  revalidatePath(PROFILE_PATH);
}

export async function addSkillAction(formData: FormData) {
  const user = await requireRole(["CANDIDATE"]);
  const candidateId = await requireCandidateProfileId(user.id);

  const parsed = skillSchema.safeParse({
    skillName: formData.get("skillName"),
    proficiency: formData.get("proficiency"),
    yearsOfExperience: formData.get("yearsOfExperience"),
  });
  if (!parsed.success) return;

  const { skillName, proficiency, yearsOfExperience } = parsed.data;

  const skill = await prisma.skill.upsert({
    where: { name: skillName },
    create: { name: skillName },
    update: {},
  });

  await prisma.candidateSkill.upsert({
    where: { candidateId_skillId: { candidateId, skillId: skill.id } },
    create: { candidateId, skillId: skill.id, proficiency, yearsOfExperience },
    update: { proficiency, yearsOfExperience },
  });

  await recalculateProfileCompletion(candidateId);
  revalidatePath(PROFILE_PATH);
}

export async function deleteSkillAction(candidateSkillId: string) {
  const user = await requireRole(["CANDIDATE"]);
  const candidateId = await requireCandidateProfileId(user.id);

  // Ownership check: only delete if this row actually belongs to the
  // caller's own candidate profile.
  await prisma.candidateSkill.deleteMany({
    where: { id: candidateSkillId, candidateId },
  });

  await recalculateProfileCompletion(candidateId);
  revalidatePath(PROFILE_PATH);
}

export async function addEducationAction(formData: FormData) {
  const user = await requireRole(["CANDIDATE"]);
  const candidateId = await requireCandidateProfileId(user.id);

  const parsed = educationSchema.safeParse({
    institution: formData.get("institution"),
    degree: formData.get("degree"),
    field: formData.get("field"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    grade: formData.get("grade"),
  });
  if (!parsed.success) return;

  const { institution, degree, field, startDate, endDate, grade } = parsed.data;

  await prisma.education.create({
    data: {
      candidateId,
      institution,
      degree,
      field,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      grade: grade || null,
    },
  });

  await recalculateProfileCompletion(candidateId);
  revalidatePath(PROFILE_PATH);
}

export async function deleteEducationAction(educationId: string) {
  const user = await requireRole(["CANDIDATE"]);
  const candidateId = await requireCandidateProfileId(user.id);

  await prisma.education.deleteMany({ where: { id: educationId, candidateId } });

  await recalculateProfileCompletion(candidateId);
  revalidatePath(PROFILE_PATH);
}

export async function addExperienceAction(formData: FormData) {
  const user = await requireRole(["CANDIDATE"]);
  const candidateId = await requireCandidateProfileId(user.id);

  const parsed = experienceSchema.safeParse({
    company: formData.get("company"),
    position: formData.get("position"),
    description: formData.get("description"),
    skillsUsed: formData.get("skillsUsed"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    isCurrent: formData.get("isCurrent") === "on",
  });
  if (!parsed.success) return;

  const { company, position, description, skillsUsed, startDate, endDate, isCurrent } =
    parsed.data;

  await prisma.experience.create({
    data: {
      candidateId,
      company,
      position,
      description: description || null,
      skillsUsed: parseCommaList(skillsUsed),
      startDate: new Date(startDate),
      endDate: isCurrent ? null : endDate ? new Date(endDate) : null,
      isCurrent: !!isCurrent,
    },
  });

  await recalculateProfileCompletion(candidateId);
  revalidatePath(PROFILE_PATH);
}

export async function deleteExperienceAction(experienceId: string) {
  const user = await requireRole(["CANDIDATE"]);
  const candidateId = await requireCandidateProfileId(user.id);

  await prisma.experience.deleteMany({ where: { id: experienceId, candidateId } });

  await recalculateProfileCompletion(candidateId);
  revalidatePath(PROFILE_PATH);
}

export async function addProjectAction(formData: FormData) {
  const user = await requireRole(["CANDIDATE"]);
  const candidateId = await requireCandidateProfileId(user.id);

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    technologies: formData.get("technologies"),
    projectUrl: formData.get("projectUrl"),
    githubUrl: formData.get("githubUrl"),
  });
  if (!parsed.success) return;

  const { name, description, technologies, projectUrl, githubUrl } = parsed.data;

  await prisma.project.create({
    data: {
      candidateId,
      name,
      description: description || null,
      technologies: parseCommaList(technologies),
      projectUrl: projectUrl || null,
      githubUrl: githubUrl || null,
    },
  });

  await recalculateProfileCompletion(candidateId);
  revalidatePath(PROFILE_PATH);
}

export async function deleteProjectAction(projectId: string) {
  const user = await requireRole(["CANDIDATE"]);
  const candidateId = await requireCandidateProfileId(user.id);

  await prisma.project.deleteMany({ where: { id: projectId, candidateId } });

  await recalculateProfileCompletion(candidateId);
  revalidatePath(PROFILE_PATH);
}

export async function addCertificationAction(formData: FormData) {
  const user = await requireRole(["CANDIDATE"]);
  const candidateId = await requireCandidateProfileId(user.id);

  const parsed = certificationSchema.safeParse({
    name: formData.get("name"),
    issuer: formData.get("issuer"),
    issueDate: formData.get("issueDate"),
    credentialUrl: formData.get("credentialUrl"),
  });
  if (!parsed.success) return;

  const { name, issuer, issueDate, credentialUrl } = parsed.data;

  await prisma.certification.create({
    data: {
      candidateId,
      name,
      issuer,
      issueDate: new Date(issueDate),
      credentialUrl: credentialUrl || null,
    },
  });

  revalidatePath(PROFILE_PATH);
}

export async function deleteCertificationAction(certificationId: string) {
  const user = await requireRole(["CANDIDATE"]);
  const candidateId = await requireCandidateProfileId(user.id);

  await prisma.certification.deleteMany({ where: { id: certificationId, candidateId } });
  revalidatePath(PROFILE_PATH);
}
