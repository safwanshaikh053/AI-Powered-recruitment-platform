import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PUBLISHED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CLOSING_SOON: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  CLOSED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export function JobStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn(STATUS_STYLES[status])}>
      {status.replace("_", " ")}
    </Badge>
  );
}
