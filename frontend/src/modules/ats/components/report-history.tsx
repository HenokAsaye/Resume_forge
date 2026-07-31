"use client"

import Link from "next/link"
import { ChevronRight, Gauge } from "lucide-react"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Badge } from "@/shared/ui/badge"
import { Skeleton } from "@/shared/ui/skeleton"
import { cn } from "@/shared/lib/utils"
import { useAtsReports, type ReportFilters } from "../api/use-ats"
import { formatScore, scoreTextClass } from "../lib/score"
import { formatReportDate } from "./report-view"

export type NameLookup = Record<string, string>

export function ReportHistory({
  filters,
  resumeNames,
  jobNames,
}: {
  filters?: ReportFilters
  resumeNames?: NameLookup
  jobNames?: NameLookup
}) {
  const { data, isPending, error } = useAtsReports(filters)

  if (isPending) {
    return (
      <div className="border-border border-t">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="border-border flex items-center gap-4 border-b py-4"
          >
            <Skeleton className="h-6 w-10" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="ml-auto h-4 w-24" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error ? error.message : "Could not load your reports"}
        </AlertDescription>
      </Alert>
    )
  }

  if (data.length === 0) {
    return (
      <div className="border-border border-t py-16 text-center">
        <Gauge className="text-muted-foreground/60 mx-auto size-6" />
        <p className="mt-3 font-medium">No reports yet</p>
        <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
          Pick a parsed résumé and a parsed job above. Every analysis is kept, so
          you can watch a score move as you revise.
        </p>
      </div>
    )
  }

  return (
    <ul className="border-border border-t">
      {data.map((report) => (
        <li
          key={report.id}
          className="border-border hover:bg-muted/40 border-b transition-colors"
        >
          <Link
            href={`/ats/${report.id}`}
            className="flex items-center gap-4 py-4 pr-1 pl-1"
          >
            <span
              className={cn(
                "tabular w-10 shrink-0 text-lg font-semibold",
                scoreTextClass(report.match_score)
              )}
            >
              {formatScore(report.match_score)}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {resumeNames?.[report.resume_id] ?? "Résumé"}
                <span className="text-muted-foreground font-normal"> against </span>
                {jobNames?.[report.job_id] ?? "job"}
              </span>
              <span className="text-muted-foreground font-mono text-xs">
                {formatReportDate(report.created_at)}
              </span>
            </span>

            {report.analysis_stage === "optimized" && (
              <Badge variant="secondary" className="shrink-0">
                Optimized
              </Badge>
            )}

            <ChevronRight className="text-muted-foreground/50 size-4 shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
