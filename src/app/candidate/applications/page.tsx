import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { listApplicationsForCandidate } from "@/services/application";
import { withdrawApplicationAction } from "@/actions/application";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationStageBadge } from "@/components/shared/application-stage-badge";
import { DeleteButton } from "@/components/shared/delete-button";

export default async function CandidateApplicationsPage() {
  const user = await requireRole(["CANDIDATE"]);
  const applications = await listApplicationsForCandidate(user.id);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">My applications</h1>

      <div className="space-y-3">
        {applications.map((app) => (
          <Card key={app.id}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">
                  <Link href={`/jobs/${app.jobId}`} className="hover:underline">
                    {app.job.title}
                  </Link>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {app.job.company.name} · Applied{" "}
                  {new Date(app.appliedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <ApplicationStageBadge stage={app.stage} />
            </CardHeader>
            {app.interviews.length > 0 && (
              <CardContent className="space-y-2 border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground">Interviews</p>
                {app.interviews.map((iv) => (
                  <div key={iv.id} className="rounded-md border border-border p-2 text-sm">
                    <p className="font-medium">
                      {iv.type} · {new Date(iv.scheduledAt).toLocaleString()} · {iv.durationMins} min
                    </p>
                    {iv.meetingLink && (
                      <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                        Join meeting
                      </a>
                    )}
                  </div>
                ))}
              </CardContent>
            )}
            {app.stage === "APPLIED" && (
              <CardContent>
                <DeleteButton
                  action={withdrawApplicationAction.bind(null, app.id)}
                  confirmMessage="Withdraw this application?"
                />
              </CardContent>
            )}
            {app.statusHistory.length > 0 && (
              <CardContent className="border-t border-border pt-3">
                <details>
                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                    History
                  </summary>
                  <ul className="mt-2 space-y-2">
                    {app.statusHistory.map((h) => (
                      <li key={h.id} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{h.newStage}</span>
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
              </CardContent>
            )}
          </Card>
        ))}
        {applications.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No applications yet.{" "}
            <Link href="/jobs" className="text-primary hover:underline">
              Browse jobs
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
