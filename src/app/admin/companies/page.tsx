import { requireRole } from "@/lib/permissions";
import { listCompaniesForModeration } from "@/services/admin";
import { approveCompanyAction, rejectCompanyAction } from "@/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminNav } from "@/components/shared/admin-nav";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default async function AdminCompaniesPage() {
  await requireRole(["ADMIN"]);
  const companies = await listCompaniesForModeration();

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
      <AdminNav />

      <div className="space-y-2">
        {companies.map((c) => (
          <Card key={c.id}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">{c.name}</CardTitle>
                <CardDescription>
                  {c._count.jobs} job{c._count.jobs === 1 ? "" : "s"} ·{" "}
                  {c._count.recruiters} recruiter{c._count.recruiters === 1 ? "" : "s"}
                  {c.industry ? ` · ${c.industry}` : ""}
                </CardDescription>
              </div>
              <Badge className={STATUS_STYLES[c.status]}>{c.status}</Badge>
            </CardHeader>
            {c.status === "PENDING" && (
              <CardContent className="flex gap-2">
                <form action={approveCompanyAction.bind(null, c.id)}>
                  <Button type="submit" size="sm">
                    Approve
                  </Button>
                </form>
                <form action={rejectCompanyAction.bind(null, c.id)}>
                  <Button type="submit" variant="destructive" size="sm">
                    Reject
                  </Button>
                </form>
              </CardContent>
            )}
          </Card>
        ))}
        {companies.length === 0 && (
          <p className="text-sm text-muted-foreground">No companies yet.</p>
        )}
      </div>
    </main>
  );
}
