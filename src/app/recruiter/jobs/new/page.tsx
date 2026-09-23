import { requireRole } from "@/lib/permissions";
import { getRecruiterProfileWithCompany } from "@/services/company";
import { redirect } from "next/navigation";
import { createJobAction } from "@/actions/job";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function NewJobPage() {
  const user = await requireRole(["RECRUITER"]);
  const recruiter = await getRecruiterProfileWithCompany(user.id);

  if (!recruiter?.company) {
    redirect("/recruiter");
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Post a new job</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createJobAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job title</Label>
              <Input id="title" name="title" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={5} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibilities">Responsibilities</Label>
              <Textarea id="responsibilities" name="responsibilities" rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea id="requirements" name="requirements" rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment type</Label>
                <select
                  id="employmentType"
                  name="employmentType"
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
                <Input id="salaryMin" name="salaryMin" type="number" min="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMax">Salary max</Label>
                <Input id="salaryMax" name="salaryMax" type="number" min="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="minExperienceYears">Min. experience (years)</Label>
                <Input id="minExperienceYears" name="minExperienceYears" type="number" min="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="educationRequirement">Education requirement</Label>
                <Input id="educationRequirement" name="educationRequirement" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicationDeadline">Application deadline</Label>
              <Input id="applicationDeadline" name="applicationDeadline" type="date" />
            </div>

            <Button type="submit" className="w-full">
              Create job (draft)
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
