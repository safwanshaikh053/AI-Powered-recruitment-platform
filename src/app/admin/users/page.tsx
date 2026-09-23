import { requireRole } from "@/lib/permissions";
import { listUsers } from "@/services/admin";
import { suspendUserAction, activateUserAction } from "@/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminNav } from "@/components/shared/admin-nav";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  DEACTIVATED: "bg-muted text-muted-foreground",
};

export default async function AdminUsersPage() {
  const admin = await requireRole(["ADMIN"]);
  const users = await listUsers();

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
      <AdminNav />

      <div className="space-y-2">
        {users.map((u) => (
          <Card key={u.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">
                  {u.name} <span className="text-xs text-muted-foreground">({u.role})</span>
                </p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={STATUS_STYLES[u.status]}>{u.status}</Badge>
                {u.id !== admin.id && (
                  <form
                    action={
                      u.status === "SUSPENDED"
                        ? activateUserAction.bind(null, u.id)
                        : suspendUserAction.bind(null, u.id)
                    }
                  >
                    <Button type="submit" variant="outline" size="sm">
                      {u.status === "SUSPENDED" ? "Activate" : "Suspend"}
                    </Button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
