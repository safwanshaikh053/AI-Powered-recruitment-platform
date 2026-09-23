"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  action,
  confirmMessage = "Remove this item?",
}: {
  action: () => Promise<void>;
  confirmMessage?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (confirm(confirmMessage)) {
          startTransition(() => action());
        }
      }}
      aria-label="Delete"
    >
      <Trash2 className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
}
