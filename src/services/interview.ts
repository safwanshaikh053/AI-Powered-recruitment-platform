import { prisma } from "@/lib/db/prisma";
import type { InterviewType } from "@prisma/client";

interface InterviewData {
  scheduledAt: string;
  durationMins: number;
  type: InterviewType;
  meetingLink?: string;
}

async function requireRecruiterOwnsApplication(userId: string, applicationId: string) {
  const recruiter = await prisma.recruiterProfile.findUnique({ where: { userId } });
  if (!recruiter?.companyId) throw new Error("No company associated with this account.");

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });
  if (!application || application.job.companyId !== recruiter.companyId) {
    throw new Error("Application not found or you don't have access to it.");
  }

  return { application, recruiter };
}

function parseEmails(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

export async function scheduleInterview(
  userId: string,
  applicationId: string,
  data: InterviewData & { interviewerEmails?: string }
) {
  const { application, recruiter } = await requireRecruiterOwnsApplication(userId, applicationId);

  const interview = await prisma.interview.create({
    data: {
      applicationId,
      scheduledById: recruiter.id,
      scheduledAt: new Date(data.scheduledAt),
      durationMins: data.durationMins,
      type: data.type,
      meetingLink: data.meetingLink || null,
    },
  });

  // Additional interviewers, looked up by email within the same company —
  // skipDuplicates covers the scheduling recruiter accidentally listing
  // themselves twice without a separate existence check.
  const emails = parseEmails(data.interviewerEmails);
  const participantUserIds = [userId];
  if (emails.length) {
    const colleagues = await prisma.user.findMany({
      where: {
        email: { in: emails },
        recruiterProfile: { companyId: recruiter.companyId },
      },
      select: { id: true },
    });
    participantUserIds.push(...colleagues.map((c) => c.id));
  }

  await prisma.interviewParticipant.createMany({
    data: participantUserIds.map((uid) => ({
      interviewId: interview.id,
      userId: uid,
      role: "Interviewer",
    })),
    skipDuplicates: true,
  });

  const candidate = await prisma.candidateProfile.findUniqueOrThrow({
    where: { id: application.candidateId },
  });
  await prisma.notification.create({
    data: {
      userId: candidate.userId,
      type: "INTERVIEW_SCHEDULED",
      title: "Interview scheduled",
      message: `An interview has been scheduled for ${new Date(data.scheduledAt).toLocaleString()}.`,
    },
  });

  return interview;
}

export async function updateInterview(userId: string, interviewId: string, data: InterviewData) {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { application: true },
  });
  if (!interview) throw new Error("Interview not found.");

  const { application } = await requireRecruiterOwnsApplication(userId, interview.applicationId);

  await prisma.interview.update({
    where: { id: interviewId },
    data: {
      scheduledAt: new Date(data.scheduledAt),
      durationMins: data.durationMins,
      type: data.type,
      meetingLink: data.meetingLink || null,
    },
  });

  const candidate = await prisma.candidateProfile.findUniqueOrThrow({
    where: { id: application.candidateId },
  });
  await prisma.notification.create({
    data: {
      userId: candidate.userId,
      type: "INTERVIEW_UPDATED",
      title: "Interview updated",
      message: `Your interview has been rescheduled to ${new Date(data.scheduledAt).toLocaleString()}.`,
    },
  });
}

export async function addInterviewNote(userId: string, interviewId: string, content: string) {
  const interview = await prisma.interview.findUnique({ where: { id: interviewId } });
  if (!interview) throw new Error("Interview not found.");
  await requireRecruiterOwnsApplication(userId, interview.applicationId);

  await prisma.interviewNote.create({
    data: { interviewId, authorId: userId, content },
  });
}

export async function listInterviewsForApplication(applicationId: string) {
  return prisma.interview.findMany({
    where: { applicationId },
    include: {
      participants: { include: { user: { select: { name: true, email: true } } } },
      notes: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
    orderBy: { scheduledAt: "asc" },
  });
}

export async function listUpcomingInterviewsForCandidate(userId: string) {
  const candidate = await prisma.candidateProfile.findUnique({ where: { userId } });
  if (!candidate) return [];

  return prisma.interview.findMany({
    where: { application: { candidateId: candidate.id } },
    include: {
      application: { include: { job: { include: { company: { select: { name: true } } } } } },
    },
    orderBy: { scheduledAt: "asc" },
  });
}
