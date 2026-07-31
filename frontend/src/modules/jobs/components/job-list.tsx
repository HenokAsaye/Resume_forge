"use client"

import Link from "next/link"
import { Briefcase, ChevronRight, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { useJobs } from "../api/use-jobs"
import { CreateJobDialog } from "./create-job-dialog"
import { DeleteJobDialog } from "./delete-job-dialog"

const dateFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
})

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : dateFormat.format(date)
}

function EmptyState() {
  return (
    <div className="border-border border-t py-16 text-center">
      <Briefcase className="text-muted-foreground/60 mx-auto size-6" />
      <p className="mt-3 font-medium">No jobs yet</p>
      <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
        Paste a posting to have its requirements and keywords extracted. Scoring
        a résumé needs a parsed job on the other side.
      </p>
      <div className="mt-5">
        <CreateJobDialog />
      </div>
    </div>
  )
}

export function JobList() {
  const { data, isPending, error } = useJobs()

  if (isPending) {
    return (
      <div className="border-border border-t">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="border-border flex items-center gap-4 border-b py-4"
          >
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error ? error.message : "Could not load your jobs"}
        </AlertDescription>
      </Alert>
    )
  }

  if (data.length === 0) {
    return <EmptyState />
  }

  return (
    <ul className="border-border border-t">
      {data.map((job) => (
        <li
          key={job.id}
          className="border-border hover:bg-muted/40 flex items-center gap-4 border-b transition-colors"
        >
          <Link
            href={`/jobs/${job.id}`}
            className="flex min-w-0 flex-1 items-center gap-4 py-4 pl-1"
          >
            <Briefcase className="text-muted-foreground size-4 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{job.title}</span>
              <span className="text-muted-foreground font-mono text-xs">
                {job.company ? `${job.company} · ` : ""}
                {formatDate(job.created_at)}
              </span>
            </span>
            <ChevronRight className="text-muted-foreground/50 size-4 shrink-0" />
          </Link>

          <DeleteJobDialog
            id={job.id}
            title={job.title}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${job.title}`}
                className="text-muted-foreground hover:text-destructive mr-1 shrink-0"
              >
                <Trash2 />
              </Button>
            }
          />
        </li>
      ))}
    </ul>
  )
}
