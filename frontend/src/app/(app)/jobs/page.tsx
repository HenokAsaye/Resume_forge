import type { Metadata } from "next"
import { CreateJobDialog, JobList } from "@/modules/jobs"

export const metadata: Metadata = {
  title: "Jobs",
}

export default function JobsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
            Jobs
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Postings you are targeting
          </h1>
          <p className="text-muted-foreground text-sm">
            Paste a description, parse it into requirements, then score a résumé
            against it.
          </p>
        </div>

        <CreateJobDialog />
      </div>

      <JobList />
    </div>
  )
}
