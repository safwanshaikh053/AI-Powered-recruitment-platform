import { requireRole } from "@/lib/permissions";
import { listAuditLogs } from "@/services/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminNav } from "@/components/shared/admin-nav";

export default async function AdminAuditLogPage() {
  await requireRole(["ADMIN"]);
  const logs = await listAuditLogs();

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
      <AdminNav />

      <div className="space-y-2">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm">
                  <Badge variant="outline" className="mr-2">
                    {log.action.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-muted-foreground">
                    {log.entityType} · {log.entityId.slice(0, 12)}...
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {log.user ? `${log.user.name} (${log.user.email})` : "System"} ·{" "}
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        {logs.length === 0 && (
          <p className="text-sm text-muted-foreground">No audit log entries yet.</p>
        )}
      </div>
    </main>
  );
}
