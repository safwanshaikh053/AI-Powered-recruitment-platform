import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/permissions";
import { getJobForRecruiter } from "@/services/job";
import {
  updateJobAction,
  publishJobAction,
  unpublishJobAction,
  markJobClosingSoonAction,
  closeJobAction,
  addJobSkillAction,
  removeJobSkillAction,
} from "@/actions/job";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { JobStatusBadge } from "@/components/shared/job-status-badge";
import { DeleteButton } from "@/components/shared/delete-button";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const user = await requireRole(["RECRUITER"]);
  const job = await getJobForRecruiter(user.id, jobId);

  if (!job) notFound();

  const updateAction = updateJobAction.bind(null, jobId);

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{job.title}</CardTitle>
            <CardDescription>
              <Link href={`/recruiter/jobs/${jobId}/applications`} className="hover:underline">
                {job._count.applications} application{job._count.applications === 1 ? "" : "s"}
              </Link>
            </CardDescription>
          </div>
          <JobStatusBadge status={job.status} />
        </CardHeader>
        <CardContent className="flex gap-2">
          {job.status === "DRAFT" && (
            <form action={publishJobAction.bind(null, jobId)}>
              <Button type="submit">Publish</Button>
            </form>
          )}
          {job.status === "PUBLISHED" && (
            <>
              <form action={markJobClosingSoonAction.bind(null, jobId)}>
                <Button type="submit" variant="outline">
                  Mark closing soon
                </Button>
              </form>
              <form action={unpublishJobAction.bind(null, jobId)}>
                <Button type="submit" variant="outline">
                  Unpublish
                </Button>
              </form>
              <form action={closeJobAction.bind(null, jobId)}>
                <Button type="submit" variant="destructive">
                  Close job
                </Button>
              </form>
            </>
          )}
          {job.status === "CLOSING_SOON" && (
            <form action={closeJobAction.bind(null, jobId)}>
              <Button type="submit" variant="destructive">
                Close job
              </Button>
            </form>
          )}
          {job.status === "CLOSED" && (
            <p className="text-sm text-muted-foreground">This job is closed.</p>
          )}
        </CardContent>
      </Card>

      {/* Required skills */}
      <Card>
        <CardHeader>
          <CardTitle>Required skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {job.requiredSkills.map((js) => (
              <Badge key={js.id} variant="outline" className="gap-1 pr-1">
                {js.skill.name} {js.isPreferred ? "(preferred)" : "(required)"}
                <DeleteButton
                  action={removeJobSkillAction.bind(null, jobId, js.id)}
                  confirmMessage="Remove this skill requirement?"
                />
              </Badge>
            ))}
            {job.requiredSkills.length === 0 && (
              <p className="text-sm text-muted-foreground">No skills added yet.</p>
            )}
          </div>
          <form
            action={addJobSkillAction.bind(null, jobId)}
            className="flex flex-wrap items-center gap-3"
          >
            <Input name="skillName" placeholder="Skill name" required className="max-w-xs" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isPreferred" className="h-4 w-4" />
              Preferred (not required)
            </label>
            <Button type="submit" size="sm">
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Edit job details */}
      <Card>
        <CardHeader>
          <CardTitle>Job details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job title</Label>
              <Input id="title" name="title" defaultValue={job.title} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={5}
                defaultValue={job.description}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibilities">Responsibilities</Label>
              <Textarea
                id="responsibilities"
                name="responsibilities"
                rows={3}
                defaultValue={job.responsibilities ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                name="requirements"
                rows={3}
                defaultValue={job.requirements ?? ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment type</Label>
                <select
                  id="employmentType"
                  name="employmentType"
                  defaultValue={job.employmentType}
                  required
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="FULL_TIME">Full-time</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="FREELANCE">Freelance</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workMode">Work mode</Label>
                <select
                  id="workMode"
                  name="workMode"
                  defaultValue={job.workMode}
                  required
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">On-site</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="salaryMin">Salary min</Label>
                <Input
                  id="salaryMin"
                  name="salaryMin"
                  type="number"
                  min="0"
                  defaultValue={job.salaryMin ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMax">Salary max</Label>
                <Input
                  id="salaryMax"
                  name="salaryMax"
                  type="number"
                  min="0"
                  defaultValue={job.salaryMax ?? ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="minExperienceYears">Min. experience (years)</Label>
                <Input
                  id="minExperienceYears"
                  name="minExperienceYears"
                  type="number"
                  min="0"
                  defaultValue={job.minExperienceYears ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="educationRequirement">Education requirement</Label>
                <Input
                  id="educationRequirement"
                  name="educationRequirement"
                  defaultValue={job.educationRequirement ?? ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" defaultValue={job.location ?? ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicationDeadline">Application deadline</Label>
              <Input
                id="applicationDeadline"
                name="applicationDeadline"
                type="date"
                defaultValue={
                  job.applicationDeadline
                    ? new Date(job.applicationDeadline).toISOString().slice(0, 10)
                    : ""
                }
              />
            </div>

            <Button type="submit" className="w-full">
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
