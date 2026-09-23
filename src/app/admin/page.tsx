import { requireRole } from "@/lib/permissions";
import { getPlatformStats } from "@/services/admin";
import { getAdminAnalytics } from "@/services/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminNav } from "@/components/shared/admin-nav";
import { LineChartCard } from "@/components/dashboard/line-chart-card";
import { BarChartCard } from "@/components/dashboard/bar-chart-card";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function AdminHomePage() {
  const user = await requireRole(["ADMIN"]);
  const stats = await getPlatformStats();
  const analytics = await getAdminAnalytics();

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">Signed in as {user.name} ({user.email})</p>
      </div>

      <AdminNav />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total users" value={stats.totalUsers} />
        <StatCard label="Candidates" value={stats.totalCandidates} />
        <StatCard label="Recruiters" value={stats.totalRecruiters} />
        <StatCard label="Companies" value={stats.totalCompanies} />
        <StatCard label="Pending approval" value={stats.pendingCompanies} />
        <StatCard label="Active jobs" value={stats.activeJobs} />
        <StatCard label="Applications" value={stats.totalApplications} />
        <StatCard label="Hires" value={stats.totalHires} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LineChartCard title="User growth (30 days)" data={analytics.userGrowth} />
        <LineChartCard title="Job growth (30 days)" data={analytics.jobGrowth} />
        <LineChartCard title="Application growth (30 days)" data={analytics.applicationGrowth} />
        <BarChartCard title="Recruitment funnel" data={analytics.funnel} xKey="stage" layout="vertical" />
      </div>
    </main>
  );
}
