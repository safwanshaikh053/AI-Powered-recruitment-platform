import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STEPS = [
  {
    title: "Apply or post",
    body: "Candidates build a profile once and apply anywhere. Recruiters post a role with the skills and experience it actually needs.",
  },
  {
    title: "Get matched",
    body: "Every application is scored against the role's real requirements — skills, experience, and projects, not just keywords.",
  },
  {
    title: "Move forward",
    body: "Recruiters shortlist and schedule interviews in one place. Candidates track every application and every stage change.",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Hiring, matched by{" "}
          <span className="text-gradient-primary">more than a keyword search</span>
        </h1>
        <p className="max-w-xl text-balance text-muted-foreground sm:text-lg">
          Post a role and get candidates ranked by real fit. Apply to jobs and see
          exactly how you stack up before a recruiter ever does.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/register">Get started</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/jobs">Browse jobs</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <Card key={step.title}>
              <CardContent className="p-6">
                <span className="font-display text-sm font-semibold text-primary">
                  {i + 1}
                </span>
                <h3 className="mt-2 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
