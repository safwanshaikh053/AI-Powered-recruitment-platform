import { Badge } from "@/components/ui/badge";

export function MatchScoreDisplay({
  score,
  matchingSkills,
  missingSkills,
  partialSkills,
  explanation,
}: {
  score: number;
  matchingSkills: string[];
  missingSkills: string[];
  partialSkills: string[];
  explanation: string;
}) {
  const color =
    score >= 75
      ? "text-emerald-600 dark:text-emerald-400"
      : score >= 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="space-y-3">
      <p className={`text-3xl font-semibold ${color}`}>{score}% Match</p>
      <p className="text-sm text-muted-foreground">{explanation}</p>

      {matchingSkills.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Strong matches</p>
          <div className="flex flex-wrap gap-1">
            {matchingSkills.map((s) => (
              <Badge key={s} className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                ✓ {s}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {partialSkills.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Nice-to-have matches</p>
          <div className="flex flex-wrap gap-1">
            {partialSkills.map((s) => (
              <Badge key={s} className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                △ {s}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {missingSkills.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Missing</p>
          <div className="flex flex-wrap gap-1">
            {missingSkills.map((s) => (
              <Badge key={s} className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                ✕ {s}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
