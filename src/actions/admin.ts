"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/db/prisma";

export async function suspendUserAction(targetUserId: string) {
  const admin = await requireRole(["ADMIN"]);
  if (admin.id === targetUserId) return; // can't suspend your own account

  await prisma.user.update({
    where: { id: targetUserId },
    data: { status: "SUSPENDED" },
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "USER_SUSPENDED",
      entityType: "User",
      entityId: targetUserId,
    },
  });

  revalidatePath("/admin/users");
}

export async function activateUserAction(targetUserId: string) {
  const admin = await requireRole(["ADMIN"]);

  await prisma.user.update({
    where: { id: targetUserId },
    data: { status: "ACTIVE" },
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "USER_ACTIVATED",
      entityType: "User",
      entityId: targetUserId,
    },
  });

  revalidatePath("/admin/users");
}

export async function approveCompanyAction(companyId: string) {
  const admin = await requireRole(["ADMIN"]);

  await prisma.company.update({
    where: { id: companyId },
    data: { status: "APPROVED" },
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "COMPANY_APPROVED",
      entityType: "Company",
      entityId: companyId,
    },
  });

  revalidatePath("/admin/companies");
}

export async function rejectCompanyAction(companyId: string) {
  const admin = await requireRole(["ADMIN"]);

  await prisma.company.update({
    where: { id: companyId },
    data: { status: "REJECTED" },
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "COMPANY_REJECTED",
      entityType: "Company",
      entityId: companyId,
    },
  });

  revalidatePath("/admin/companies");
}
