"use client"

import Link from "next/link"
import { ChevronRight, GitBranch } from "lucide-react"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Skeleton } from "@/shared/ui/skeleton"
import { useResumeVersions } from "../api/use-optimization"

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormat.format(date)
}

export function VersionTimeline({ resumeId }: { resumeId: string }) {
  const { data, isPending, error } = useResumeVersions(resumeId)

  if (isPending) {
    return (
      <div className="border-border border-t">
        {[0, 1].map((row) => (
          <div
            key={row}
            className="border-border flex items-center gap-4 border-b py-4"
          >
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="ml-auto h-4 w-28" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error ? error.message : "Could not load versions"}
        </AlertDescription>
      </Alert>
    )
  }

  if (data.length === 0) {
    return (
      <div className="border-border border-t py-16 text-center">
        <GitBranch className="text-muted-foreground/60 mx-auto size-6" />
        <p className="mt-3 font-medium">No optimized versions yet</p>
        <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
          Optimizing rewrites this résumé for a specific job and keeps the
          original untouched. Each run adds a version you can compare and export.
        </p>
      </div>
    )
  }

  const ordered = [...data].sort((a, b) => b.version_number - a.version_number)

  return (
    <ul className="border-border border-t">
      {ordered.map((version) => (
        <li
          key={version.id}
          className="border-border hover:bg-muted/40 border-b transition-colors"
        >
          <Link
            href={`/resumes/${resumeId}/versions/${version.id}`}
            className="flex items-center gap-4 py-4 pr-1 pl-1"
          >
            <span className="text-muted-foreground tabular w-10 shrink-0 font-mono text-sm">
              v{version.version_number}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                Version {version.version_number}
              </span>
              <span className="text-muted-foreground font-mono text-xs">
                {formatDate(version.created_at)}
              </span>
            </span>
            <ChevronRight className="text-muted-foreground/50 size-4 shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
