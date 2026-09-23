import { notFound } from "next/navigation";
import { requireRole } from "@/lib/permissions";
import { listApplicationsForJob, getAllowedNextStages } from "@/services/application";
import { getJobForRecruiter } from "@/services/job";
import { changeApplicationStageAction } from "@/actions/application";
import { scheduleInterviewAction, addInterviewNoteAction, updateInterviewAction } from "@/actions/interview";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApplicationStageBadge } from "@/components/shared/application-stage-badge";
import { MatchScoreDisplay } from "@/components/shared/match-score-display";
import { calculateApplicantMatchesAction } from "@/actions/ai-matching";

const STAGE_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

export default async function JobApplicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ interviewError?: string }>;
}) {
  const { jobId } = await params;
  const { interviewError } = await searchParams;
  const user = await requireRole(["RECRUITER"]);

  const job = await getJobForRecruiter(user.id, jobId);
  if (!job) notFound();

  const applications = await listApplicationsForJob(user.id, jobId);

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
          <p className="text-sm text-muted-foreground">{applications.length} applicants</p>
        </div>
        {applications.length > 0 && (
          <form action={calculateApplicantMatchesAction.bind(null, jobId)}>
            <Button type="submit" variant="outline" size="sm">
              Calculate match scores
            </Button>
          </form>
        )}
      </div>

      {interviewError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {interviewError}
        </p>
      )}

      <div className="space-y-4">
        {applications.map((app) => {
          const nextStages = getAllowedNextStages(app.stage);
          return (
            <Card key={app.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">{app.candidate.user.name}</CardTitle>
                  <CardDescription>{app.candidate.user.email}</CardDescription>
                </div>
                <ApplicationStageBadge stage={app.stage} />
              </CardHeader>
              <CardContent className="space-y-3">
                {app.aiAnalysis && (
                  <div className="rounded-md border border-border bg-muted/50 p-3">
                    <MatchScoreDisplay
                      score={app.aiAnalysis.matchScore ?? 0}
                      matchingSkills={app.aiAnalysis.matchingSkills}
                      missingSkills={app.aiAnalysis.missingSkills}
                      partialSkills={app.aiAnalysis.partialSkills}
                      explanation={app.aiAnalysis.explanation ?? ""}
                    />
                  </div>
                )}

                {app.resume && (
                  <a href={app.resume.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-medium text-primary hover:underline">
                    View resume ({app.resume.fileName})
                  </a>
                )}

                {app.coverLetter && (
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {app.coverLetter}
                  </p>
                )}

                {app.candidate.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {app.candidate.skills.map((cs) => (
                      <Badge key={cs.id} variant="outline">
                        {cs.skill.name}
                      </Badge>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {app.candidate.experience.length} work experience ·{" "}
                  {app.candidate.education.length} education entries
                </p>

                {nextStages.length > 0 ? (
                  <form
                    action={changeApplicationStageAction.bind(null, app.id, jobId)}
                    className="flex flex-wrap items-center gap-2 border-t border-border pt-3"
                  >
                    <select
                      name="newStage"
                      required
                      className="flex h-9 rounded-md border border-border bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <option value="">Move to...</option>
                      {nextStages.map((s) => (
                        <option key={s} value={s}>
                          {STAGE_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <Input name="note" placeholder="Note (optional)" className="max-w-xs" />
                    <Button type="submit" size="sm">
                      Update
                    </Button>
                  </form>
                ) : (
                  <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                    This application has reached a final stage.
                  </p>
                )}

                {/* Interviews */}
                <div className="border-t border-border pt-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Interviews</p>

                  {app.interviews.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {app.interviews.map((iv) => (
                        <div key={iv.id} className="rounded-md border border-border p-2 text-sm">
                          <p className="font-medium">
                            {iv.type} · {new Date(iv.scheduledAt).toLocaleString()} · {iv.durationMins} min
                          </p>
                          {iv.meetingLink && (
                            <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                              Meeting link
                            </a>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Interviewers: {iv.participants.map((p) => p.user.name).join(", ")}
                          </p>
                          {iv.notes.length > 0 && (
                            <ul className="mt-1 space-y-1">
                              {iv.notes.map((n) => (
                                <li key={n.id} className="text-xs text-muted-foreground">
                                  {n.author.name}: {n.content}
                                </li>
                              ))}
                            </ul>
                          )}
                          <form action={addInterviewNoteAction.bind(null, iv.id, jobId)} className="mt-2 flex gap-2">
                            <Input name="content" placeholder="Add a note" className="h-8 text-xs" />
                            <Button type="submit" size="sm" variant="outline">
                              Add
                            </Button>
                          </form>
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs font-medium text-primary">
                              Reschedule
                            </summary>
                            <form
                              action={updateInterviewAction.bind(null, iv.id, jobId)}
                              className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2"
                            >
                              <Input
                                name="scheduledAt"
                                type="datetime-local"
                                defaultValue={new Date(iv.scheduledAt).toISOString().slice(0, 16)}
                                required
                              />
                              <Input
                                name="durationMins"
                                type="number"
                                defaultValue={iv.durationMins}
                                min={15}
                                max={480}
                                required
                              />
                              <select
                                name="type"
                                defaultValue={iv.type}
                                required
                                className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              >
                                <option value="TECHNICAL">Technical</option>
                                <option value="HR">HR</option>
                                <option value="BEHAVIORAL">Behavioral</option>
                                <option value="FINAL">Final</option>
                                <option value="OTHER">Other</option>
                              </select>
                              <Input
                                name="meetingLink"
                                placeholder="Meeting link (optional)"
                                defaultValue={iv.meetingLink ?? ""}
                              />
                              <Button type="submit" size="sm" className="sm:col-span-2">
                                Save changes
                              </Button>
                            </form>
                          </details>
                        </div>
                      ))}
                    </div>
                  )}

                  {app.stage === "INTERVIEW" && (
                    <details>
                      <summary className="cursor-pointer text-xs font-medium text-primary">
                        Schedule an interview
                      </summary>
                      <form
                        action={scheduleInterviewAction.bind(null, app.id, jobId)}
                        className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2"
                      >
                        <Input name="scheduledAt" type="datetime-local" required />
                        <Input name="durationMins" type="number" defaultValue={30} min={15} max={480} required />
                        <select
                          name="type"
                          required
                          className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <option value="TECHNICAL">Technical</option>
                          <option value="HR">HR</option>
                          <option value="BEHAVIORAL">Behavioral</option>
                          <option value="FINAL">Final</option>
                          <option value="OTHER">Other</option>
                        </select>
                        <Input name="meetingLink" placeholder="Meeting link (optional)" />
                        <Input
                          name="interviewerEmails"
                          placeholder="Other interviewer emails, comma-separated (optional)"
                          className="sm:col-span-2"
                        />
                        <Button type="submit" className="sm:col-span-2">
                          Schedule
                        </Button>
                      </form>
                    </details>
                  )}
                </div>

                {app.statusHistory.length > 0 && (
                  <details className="border-t border-border pt-3">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                      History
                    </summary>
                    <ul className="mt-2 space-y-2">
                      {app.statusHistory.map((h) => (
                        <li key={h.id} className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{h.newStage}</span>
                          {" · "}
                          {h.changedBy.name}
                          {" · "}
                          {new Date(h.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                          {h.note && <> — {h.note}</>}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </CardContent>
            </Card>
          );
        })}
        {applications.length === 0 && (
          <p className="text-sm text-muted-foreground">No applications yet.</p>
        )}
      </div>
    </main>
  );
}
