import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { PDFParse } from "pdf-parse";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { requireCandidateProfileId } from "@/services/candidate-profile";

const f = createUploadthing();

export const ourFileRouter = {
  // "pdf" restricts the client's file picker and enforces the size limit
  // server-side — resumes are PDF-only for now (docx support is a
  // reasonable future addition, noted in the README).
  resumeUploader: f({ pdf: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user || session.user.role !== "CANDIDATE") {
        throw new UploadThingError("Unauthorized");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const candidateId = await requireCandidateProfileId(metadata.userId);

      let extractedText = "";
      try {
        const res = await fetch(file.url);
        const buffer = Buffer.from(await res.arrayBuffer());
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        // Capped — this is raw material for Phase 8's AI matching, not a
        // full document store; no need to keep megabytes of PDF text.
        extractedText = result.text.slice(0, 20000);
        await parser.destroy();
      } catch (err) {
        // Text extraction failing (a scanned/image-only PDF, a corrupt
        // file) must never block the upload itself — the resume file is
        // still valid and viewable even without extracted text.
        console.error("Resume text extraction failed:", err);
      }

      // Only one active resume at a time — older ones stay in the table
      // (for referential integrity with any Application.resumeId already
      // pointing at them) but stop being "the" resume.
      await prisma.resume.updateMany({
        where: { candidateId },
        data: { isActive: false },
      });

      await prisma.resume.create({
        data: {
          candidateId,
          fileUrl: file.url,
          fileKey: file.key,
          fileName: file.name,
          fileSize: file.size,
          extractedText: extractedText || null,
          isActive: true,
        },
      });

      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
