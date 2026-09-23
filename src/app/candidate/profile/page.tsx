import { requireRole } from "@/lib/permissions";
import { getFullCandidateProfile } from "@/services/candidate-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ProfileCompletionCard } from "@/components/dashboard/profile-completion-card";
import { DeleteButton } from "@/components/shared/delete-button";
import { ResumeUploadButton } from "@/components/forms/resume-upload-button";
import { deleteResumeAction } from "@/actions/resume";
import {
  updatePersonalInfoAction,
  addSkillAction,
  deleteSkillAction,
  addEducationAction,
  deleteEducationAction,
  addExperienceAction,
  deleteExperienceAction,
  addProjectAction,
  deleteProjectAction,
  addCertificationAction,
  deleteCertificationAction,
} from "@/actions/candidate-profile";

function fmtDate(d: Date | null) {
  if (!d) return "Present";
  return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default async function CandidateProfilePage() {
  const user = await requireRole(["CANDIDATE"]);
  const profile = await getFullCandidateProfile(user.id);

  if (!profile) {
    return <p className="p-6 text-destructive">Profile not found.</p>;
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">My Profile</h1>

      <ProfileCompletionCard percentage={profile.profileCompletion} />

      {/* Resume */}
      <Card>
        <CardHeader>
          <CardTitle>Resume</CardTitle>
          <CardDescription>PDF, up to 4MB. Uploading a new one replaces the active resume.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.resumes[0] ? (
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <a
                  href={profile.resumes[0].fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  {profile.resumes[0].fileName}
                </a>
                <p className="text-xs text-muted-foreground">
                  Uploaded{" "}
                  {new Date(profile.resumes[0].uploadedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <DeleteButton
                action={deleteResumeAction.bind(null, profile.resumes[0].id)}
                confirmMessage="Delete your resume?"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No resume uploaded yet.</p>
          )}
          <ResumeUploadButton />
        </CardContent>
      </Card>

      {/* Personal info */}
      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updatePersonalInfoAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" defaultValue={profile.location ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" name="bio" rows={4} defaultValue={profile.bio ?? ""} />
            </div>
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <CardDescription>Add at least 3 to count toward profile completion.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((cs) => (
              <Badge key={cs.id} variant="outline" className="gap-1 pr-1">
                {cs.skill.name} · {cs.proficiency.toLowerCase()} · {cs.yearsOfExperience}y
                <DeleteButton action={deleteSkillAction.bind(null, cs.id)} confirmMessage="Remove this skill?" />
              </Badge>
            ))}
            {profile.skills.length === 0 && (
              <p className="text-sm text-muted-foreground">No skills added yet.</p>
            )}
          </div>
          <form action={addSkillAction} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Input name="skillName" placeholder="Skill (e.g. React)" required className="sm:col-span-2" />
            <select
              name="proficiency"
              defaultValue="INTERMEDIATE"
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="EXPERT">Expert</option>
            </select>
            <Input
              name="yearsOfExperience"
              type="number"
              step="0.5"
              min="0"
              placeholder="Years"
              required
            />
            <Button type="submit" className="sm:col-span-4">
              Add skill
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <CardTitle>Education</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {profile.education.map((ed) => (
              <div key={ed.id} className="flex items-start justify-between rounded-md border border-border p-3">
                <div>
                  <p className="font-medium">{ed.degree} in {ed.field}</p>
                  <p className="text-sm text-muted-foreground">{ed.institution}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtDate(ed.startDate)} – {fmtDate(ed.endDate)}
                    {ed.grade ? ` · ${ed.grade}` : ""}
                  </p>
                </div>
                <DeleteButton action={deleteEducationAction.bind(null, ed.id)} confirmMessage="Remove this education entry?" />
              </div>
            ))}
            {profile.education.length === 0 && (
              <p className="text-sm text-muted-foreground">No education added yet.</p>
            )}
          </div>
          <form action={addEducationAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input name="institution" placeholder="Institution" required />
            <Input name="degree" placeholder="Degree (e.g. B.Tech)" required />
            <Input name="field" placeholder="Field of study" required className="sm:col-span-2" />
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Start date</Label>
              <Input name="startDate" type="date" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">End date (optional)</Label>
              <Input name="endDate" type="date" />
            </div>
            <Input name="grade" placeholder="Grade (optional)" className="sm:col-span-2" />
            <Button type="submit" className="sm:col-span-2">
              Add education
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardHeader>
          <CardTitle>Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {profile.experience.map((exp) => (
              <div key={exp.id} className="flex items-start justify-between rounded-md border border-border p-3">
                <div>
                  <p className="font-medium">{exp.position} · {exp.company}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtDate(exp.startDate)} – {exp.isCurrent ? "Present" : fmtDate(exp.endDate)}
                  </p>
                  {exp.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{exp.description}</p>
                  )}
                  {exp.skillsUsed.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {exp.skillsUsed.map((s) => (
                        <Badge key={s}>{s}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <DeleteButton action={deleteExperienceAction.bind(null, exp.id)} confirmMessage="Remove this experience entry?" />
              </div>
            ))}
            {profile.experience.length === 0 && (
              <p className="text-sm text-muted-foreground">No experience added yet.</p>
            )}
          </div>
          <form action={addExperienceAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input name="company" placeholder="Company" required />
            <Input name="position" placeholder="Position" required />
            <Textarea name="description" placeholder="Description (optional)" className="sm:col-span-2" rows={3} />
            <Input name="skillsUsed" placeholder="Skills used, comma-separated" className="sm:col-span-2" />
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Start date</Label>
              <Input name="startDate" type="date" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">End date</Label>
              <Input name="endDate" type="date" />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="isCurrent" className="h-4 w-4" />
              I currently work here
            </label>
            <Button type="submit" className="sm:col-span-2">
              Add experience
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {profile.projects.map((p) => (
              <div key={p.id} className="flex items-start justify-between rounded-md border border-border p-3">
                <div>
                  <p className="font-medium">{p.name}</p>
                  {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                  {p.technologies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.technologies.map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-1 flex gap-3 text-xs">
                    {p.projectUrl && (
                      <a href={p.projectUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Live
                      </a>
                    )}
                    {p.githubUrl && (
                      <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
                <DeleteButton action={deleteProjectAction.bind(null, p.id)} confirmMessage="Remove this project?" />
              </div>
            ))}
            {profile.projects.length === 0 && (
              <p className="text-sm text-muted-foreground">No projects added yet.</p>
            )}
          </div>
          <form action={addProjectAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input name="name" placeholder="Project name" required className="sm:col-span-2" />
            <Textarea name="description" placeholder="Description (optional)" className="sm:col-span-2" rows={3} />
            <Input name="technologies" placeholder="Technologies, comma-separated" className="sm:col-span-2" />
            <Input name="projectUrl" placeholder="Live URL (optional)" />
            <Input name="githubUrl" placeholder="GitHub URL (optional)" />
            <Button type="submit" className="sm:col-span-2">
              Add project
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <CardTitle>Certifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {profile.certifications.map((c) => (
              <div key={c.id} className="flex items-start justify-between rounded-md border border-border p-3">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.issuer} · {fmtDate(c.issueDate)}
                  </p>
                  {c.credentialUrl && (
                    <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                      View credential
                    </a>
                  )}
                </div>
                <DeleteButton action={deleteCertificationAction.bind(null, c.id)} confirmMessage="Remove this certification?" />
              </div>
            ))}
            {profile.certifications.length === 0 && (
              <p className="text-sm text-muted-foreground">No certifications added yet.</p>
            )}
          </div>
          <form action={addCertificationAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input name="name" placeholder="Certification name" required />
            <Input name="issuer" placeholder="Issuer" required />
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Issue date</Label>
              <Input name="issueDate" type="date" required />
            </div>
            <Input name="credentialUrl" placeholder="Credential URL (optional)" />
            <Button type="submit" className="sm:col-span-2">
              Add certification
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
