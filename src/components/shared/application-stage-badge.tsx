import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

const STAGE_STYLES: Record<string, string> = {
  APPLIED: "bg-muted text-muted-foreground",
  SCREENING: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  SHORTLISTED: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  INTERVIEW: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  OFFER: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
  HIRED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export function ApplicationStageBadge({ stage }: { stage: string }) {
  return <Badge className={cn(STAGE_STYLES[stage])}>{stage}</Badge>;
}
