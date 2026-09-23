import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPublicJobDetail } from "@/services/job-search";
import { getCandidateApplicationForJob } from "@/services/application";
import { applyToJobAction } from "@/actions/application";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { JobStatusBadge } from "@/components/shared/job-status-badge";
import { ApplicationStageBadge } from "@/components/shared/application-stage-badge";
import { MatchScoreDisplay } from "@/components/shared/match-score-display";
import { getCachedMatchForUser } from "@/services/ai-matching";
import { calculateJobMatchAction } from "@/actions/ai-matching";

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ applied?: string; applyError?: string }>;
}) {
  const { jobId } = await params;
  const { applied, applyError } = await searchParams;

  const job = await getPublicJobDetail(jobId);
  if (!job) notFound();

  const session = await auth();
  const isCandidate = session?.user.role === "CANDIDATE";
  const existingApplication =
    session?.user.role === "CANDIDATE"
      ? await getCandidateApplicationForJob(session.user.id, jobId)
      : null;

  const acceptingApplications = job.status === "PUBLISHED" || job.status === "CLOSING_SOON";
  const cachedMatch =
    session?.user.role === "CANDIDATE"
      ? await getCachedMatchForUser(session.user.id, jobId)
      : null;

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl">{job.title}</CardTitle>
            <CardDescription>
              {job.company.name}
              {job.location ? ` · ${job.location}` : ""} · {job.workMode.toLowerCase().replace("_", " ")} ·{" "}
              {job.employmentType.toLowerCase().replace("_", " ")}
            </CardDescription>
          </div>
          <JobStatusBadge status={job.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          {(job.salaryMin || job.salaryMax) && (
            <p className="text-sm font-medium">
              {job.salaryMin && job.salaryMax
                ? `$${job.salaryMin.toLocaleString()} – $${job.salaryMax.toLocaleString()}`
                : `$${(job.salaryMin ?? job.salaryMax)!.toLocaleString()}+`}
            </p>
          )}

          <div>
            <h3 className="mb-1 text-sm font-medium">Description</h3>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{job.description}</p>
          </div>

          {job.responsibilities && (
            <div>
              <h3 className="mb-1 text-sm font-medium">Responsibilities</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {job.responsibilities}
              </p>
            </div>
          )}

          {job.requirements && (
            <div>
              <h3 className="mb-1 text-sm font-medium">Requirements</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {job.requirements}
              </p>
            </div>
          )}

          {job.requiredSkills.length > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-medium">Skills</h3>
              <div className="flex flex-wrap gap-1">
                {job.requiredSkills.map((js) => (
                  <Badge key={js.id} variant="outline">
                    {js.skill.name}
                    {js.isPreferred ? " (preferred)" : ""}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Match score */}
      {isCandidate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your match</CardTitle>
          </CardHeader>
          <CardContent>
            {cachedMatch ? (
              <MatchScoreDisplay
                score={cachedMatch.matchScore ?? 0}
                matchingSkills={cachedMatch.matchingSkills}
                missingSkills={cachedMatch.missingSkills}
                partialSkills={cachedMatch.partialSkills}
                explanation={cachedMatch.explanation ?? ""}
              />
            ) : (
              <form action={calculateJobMatchAction.bind(null, jobId)}>
                <Button type="submit" variant="outline">
                  See your match score
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Apply section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apply</CardTitle>
        </CardHeader>
        <CardContent>
          {!acceptingApplications && (
            <p className="text-sm text-muted-foreground">
              This job is no longer accepting applications.
            </p>
          )}

          {acceptingApplications && !session && (
            <p className="text-sm text-muted-foreground">
              <Link href={`/login?callbackUrl=/jobs/${jobId}`} className="text-primary hover:underline">
                Sign in
              </Link>{" "}
              as a candidate to apply.
            </p>
          )}

          {acceptingApplications && session && !isCandidate && (
            <p className="text-sm text-muted-foreground">
              Only candidate accounts can apply to jobs.
            </p>
          )}

          {acceptingApplications && isCandidate && existingApplication && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">You&apos;ve already applied to this job.</p>
              <ApplicationStageBadge stage={existingApplication.stage} />
            </div>
          )}

          {acceptingApplications && isCandidate && !existingApplication && (
            <form action={applyToJobAction.bind(null, jobId)} className="space-y-4">
              {applyError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {applyError}
                </p>
              )}
              {applied && (
                <p className="rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Application submitted!
                </p>
              )}
              <Textarea
                name="coverLetter"
                placeholder="Cover letter (optional)"
                rows={5}
              />
              <Button type="submit">Submit application</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
