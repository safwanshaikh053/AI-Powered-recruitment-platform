"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/permissions";
import { markNotificationRead, markAllNotificationsRead } from "@/services/notification";

export async function markNotificationReadAction(notificationId: string) {
  const user = await requireAuth();
  await markNotificationRead(user.id, notificationId);
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  const user = await requireAuth();
  await markAllNotificationsRead(user.id);
  revalidatePath("/notifications");
}
