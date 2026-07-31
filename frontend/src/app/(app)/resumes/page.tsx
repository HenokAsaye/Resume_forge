import type { Metadata } from "next"
import { ResumeList, UploadResumeDialog } from "@/modules/resumes"

export const metadata: Metadata = {
  title: "Résumés",
}

export default function ResumesPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
            Résumés
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Your documents</h1>
          <p className="text-muted-foreground text-sm">
            Upload a file, parse it into structured sections, then score it against
            a job.
          </p>
        </div>

        <UploadResumeDialog />
      </div>

      <ResumeList />
    </div>
  )
}
