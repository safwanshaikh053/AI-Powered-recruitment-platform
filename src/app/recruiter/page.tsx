import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { getRecruiterProfileWithCompany } from "@/services/company";
import { listJobsForRecruiter } from "@/services/job";
import { createCompanyAction, updateCompanyAction } from "@/actions/company";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JobStatusBadge } from "@/components/shared/job-status-badge";
import { getRecruiterAnalytics } from "@/services/analytics";
import { LineChartCard } from "@/components/dashboard/line-chart-card";
import { BarChartCard } from "@/components/dashboard/bar-chart-card";

export default async function RecruiterHomePage({
  searchParams,
}: {
  searchParams: Promise<{ companyError?: string }>;
}) {
  const user = await requireRole(["RECRUITER"]);
  const recruiter = await getRecruiterProfileWithCompany(user.id);
  const { companyError } = await searchParams;

  // No company yet — recruiter must create one before doing anything else.
  if (!recruiter?.company) {
    return (
      <main className="mx-auto max-w-lg p-6">
        <Card>
          <CardHeader>
            <CardTitle>Create your company</CardTitle>
            <CardDescription>
              You&apos;ll need a company profile before posting jobs. New companies start
              pending admin approval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {companyError && (
              <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {companyError}
              </p>
            )}
            <form action={createCompanyAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" name="website" placeholder="https://example.com" />
                <p className="text-xs text-muted-foreground">
                  Leave blank, or include https:// — a bare domain like &quot;example.com&quot; won&apos;t validate.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" name="industry" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Company size</Label>
                <Input id="size" name="size" placeholder="e.g. 11-50 employees" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
              <Button type="submit" className="w-full">
                Create company
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  const { company } = recruiter;
  const jobs = await listJobsForRecruiter(user.id);
  const analytics = await getRecruiterAnalytics(user.id);

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>{company.name}</CardTitle>
          <CardDescription>
            Status: {company.status.toLowerCase()}
            {company.status === "PENDING" && " — awaiting admin approval before jobs go public"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <details>
            <summary className="cursor-pointer text-sm font-medium">Edit company profile</summary>
            {companyError && (
              <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {companyError}
              </p>
            )}
            <form action={updateCompanyAction} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company name</Label>
                <Input id="name" name="name" defaultValue={company.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" name="website" defaultValue={company.website ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" name="industry" defaultValue={company.industry ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Company size</Label>
                <Input id="size" name="size" defaultValue={company.size ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={company.description ?? ""}
                />
              </div>
              <Button type="submit">Save changes</Button>
            </form>
          </details>
        </CardContent>
      </Card>

      {analytics && (
        <>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {[
              { label: "Active jobs", value: analytics.activeJobs },
              { label: "Applications", value: analytics.totalApplications },
              { label: "Shortlisted", value: analytics.shortlisted },
              { label: "Interviews", value: analytics.interviews },
              { label: "Offers", value: analytics.offers },
              { label: "Hires", value: analytics.hires },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-normal text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <LineChartCard title="Applications over time (30 days)" data={analytics.applicationsOverTime} />
            <BarChartCard title="Application funnel" data={analytics.funnel} xKey="stage" layout="vertical" />
            {analytics.jobsPerformance.length > 0 && (
              <BarChartCard
                title="Applications per job"
                data={analytics.jobsPerformance}
                xKey="title"
                dataKey="applications"
                layout="vertical"
              />
            )}
          </div>
        </>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Jobs</CardTitle>
            <CardDescription>{jobs.length} total</CardDescription>
          </div>
          <Button asChild>
            <Link href="/recruiter/jobs/new">Post a job</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/recruiter/jobs/${job.id}`}
              className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted"
            >
              <div>
                <p className="font-medium">{job.title}</p>
                <p className="text-xs text-muted-foreground">
                  {job._count.applications} application{job._count.applications === 1 ? "" : "s"}
                </p>
              </div>
              <JobStatusBadge status={job.status} />
            </Link>
          ))}
          {jobs.length === 0 && (
            <p className="text-sm text-muted-foreground">No jobs posted yet.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
