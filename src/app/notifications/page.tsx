import { requireAuth } from "@/lib/permissions";
import { listNotificationsForUser } from "@/services/notification";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/actions/notification";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function NotificationsPage() {
  const user = await requireAuth();
  const notifications = await listNotificationsForUser(user.id);
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        {hasUnread && (
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" variant="outline" size="sm">
              Mark all as read
            </Button>
          </form>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <Card key={n.id} className={n.isRead ? "opacity-60" : ""}>
            <CardContent className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!n.isRead && (
                <form action={markNotificationReadAction.bind(null, n.id)}>
                  <Button type="submit" variant="ghost" size="sm">
                    Mark read
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        ))}
        {notifications.length === 0 && (
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        )}
      </div>
    </main>
  );
}
