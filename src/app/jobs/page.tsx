import Link from "next/link";
import { listPublishedJobs } from "@/services/job-search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function fmtSalary(min: number | null, max: number | null) {
  if (!min && !max) return null;
  if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  return `$${(min ?? max)!.toLocaleString()}+`;
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; location?: string }>;
}) {
  const { q, location } = await searchParams;
  const jobs = await listPublishedJobs({ q, location });

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Browse jobs</h1>

      <form className="flex flex-col gap-3 sm:flex-row" action="/jobs">
        <Input name="q" placeholder="Job title or keyword" defaultValue={q ?? ""} />
        <Input name="location" placeholder="Location" defaultValue={location ?? ""} />
        <Button type="submit">Search</Button>
      </form>

      <div className="space-y-3">
        {jobs.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`}>
            <Card className="transition-colors hover:bg-muted">
              <CardHeader>
                <CardTitle className="text-lg">{job.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {job.company.name}
                  {job.location ? ` · ${job.location}` : ""} · {job.workMode.toLowerCase()}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {fmtSalary(job.salaryMin, job.salaryMax) && (
                  <p className="text-sm font-medium">{fmtSalary(job.salaryMin, job.salaryMax)}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {job.requiredSkills.slice(0, 6).map((js) => (
                    <Badge key={js.id} variant="outline">
                      {js.skill.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {jobs.length === 0 && (
          <p className="text-sm text-muted-foreground">No jobs match your search.</p>
        )}
      </div>
    </main>
  );
}
