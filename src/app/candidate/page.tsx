import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { getFullCandidateProfile, requireCandidateProfileId } from "@/services/candidate-profile";
import { listRecommendationsForCandidate } from "@/services/ai-recommendations";
import { getCandidateStats } from "@/services/analytics";
import { refreshRecommendationsAction } from "@/actions/ai-recommendations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileCompletionCard } from "@/components/dashboard/profile-completion-card";

export default async function CandidateHomePage() {
  // Belt-and-braces: middleware already blocked non-candidates from ever
  // reaching this route, but every server component/action re-checks
  // independently — middleware is never the sole authorization boundary.
  const user = await requireRole(["CANDIDATE"]);
  const profile = await getFullCandidateProfile(user.id);
  const candidateId = await requireCandidateProfileId(user.id);
  const recommendations = await listRecommendationsForCandidate(candidateId);
  const stats = await getCandidateStats(user.id);

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user.name}</CardTitle>
          <CardDescription>
            Track your applications, interviews, and recommended jobs below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Signed in as {user.email} ({user.role}).
          </p>
        </CardContent>
      </Card>

      {profile && <ProfileCompletionCard percentage={profile.profileCompletion} />}

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Applications", value: stats.total },
            { label: "Shortlisted", value: stats.shortlisted },
            { label: "Interviews", value: stats.interviews },
            { label: "Offers", value: stats.offers },
          ].map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-normal text-muted-foreground">
                  {s.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/candidate/profile">
            {profile && profile.profileCompletion < 100 ? "Complete your profile" : "Edit your profile"}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/jobs">Browse jobs</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/candidate/applications">My applications</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Recommended for you</CardTitle>
            <CardDescription>Based on your skills, experience, and profile.</CardDescription>
          </div>
          <form action={refreshRecommendationsAction}>
            <Button type="submit" variant="outline" size="sm">
              Refresh
            </Button>
          </form>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendations.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No recommendations yet — click Refresh to generate some based on your profile.
            </p>
          )}
          {recommendations.map((rec) => (
            <Link key={rec.id} href={`/jobs/${rec.jobId}`}>
              <div className="rounded-md border border-border p-3 transition-colors hover:bg-muted">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{rec.job.title}</p>
                    <p className="text-sm text-muted-foreground">{rec.job.company.name}</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {rec.score}% match
                  </Badge>
                </div>
                {rec.reason && (
                  <p className="mt-2 text-sm text-muted-foreground">{rec.reason}</p>
                )}
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
