import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfileCompletionCard({ percentage }: { percentage: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profile completion</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Progress value={percentage} className="flex-1" />
          <span className="text-sm font-medium tabular-nums">{percentage}%</span>
        </div>
        {percentage < 100 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Add personal details, at least 3 skills, one education entry, one work
            experience, and one project to reach 100%.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
