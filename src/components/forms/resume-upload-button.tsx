"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "@/lib/uploadthing";

export function ResumeUploadButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <UploadButton
        endpoint="resumeUploader"
        onClientUploadComplete={() => {
          setError(null);
          router.refresh();
        }}
        onUploadError={(err) => setError(err.message)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
