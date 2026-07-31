"use client"

import Link from "next/link"
import { ChevronRight, PenLine } from "lucide-react"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Skeleton } from "@/shared/ui/skeleton"
import { useCoverLetters, type CoverLetterFilters } from "../api/use-cover-letters"

export type NameLookup = Record<string, string>

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

export function formatLetterDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormat.format(date)
}

function preview(content: string): string {
  const flattened = content.replace(/\s+/g, " ").trim()
  return flattened.length > 120 ? `${flattened.slice(0, 120)}…` : flattened
}

export function LetterList({
  filters,
  resumeNames,
  jobNames,
}: {
  filters?: CoverLetterFilters
  resumeNames?: NameLookup
  jobNames?: NameLookup
}) {
  const { data, isPending, error } = useCoverLetters(filters)

  if (isPending) {
    return (
      <div className="border-border border-t">
        {[0, 1, 2].map((row) => (
          <div key={row} className="border-border space-y-2 border-b py-4">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-full max-w-md" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error ? error.message : "Could not load your letters"}
        </AlertDescription>
      </Alert>
    )
  }

  if (data.length === 0) {
    return (
      <div className="border-border border-t py-16 text-center">
        <PenLine className="text-muted-foreground/60 mx-auto size-6" />
        <p className="mt-3 font-medium">No cover letters yet</p>
        <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
          Generate one from a parsed résumé and job above, then edit it in place.
          The draft is a starting point, not a submission.
        </p>
      </div>
    )
  }

  return (
    <ul className="border-border border-t">
      {data.map((letter) => (
        <li
          key={letter.id}
          className="border-border hover:bg-muted/40 border-b transition-colors"
        >
          <Link
            href={`/cover-letters/${letter.id}`}
            className="flex items-start gap-4 py-4 pr-1 pl-1"
          >
            <span className="min-w-0 flex-1 space-y-1">
              <span className="block truncate text-sm font-medium">
                {resumeNames?.[letter.resume_id] ?? "Résumé"}
                <span className="text-muted-foreground font-normal"> for </span>
                {jobNames?.[letter.job_id] ?? "job"}
              </span>
              <span className="text-muted-foreground block text-sm leading-relaxed">
                {preview(letter.content)}
              </span>
              <span className="text-muted-foreground block font-mono text-xs">
                {formatLetterDate(letter.updated_at)}
              </span>
            </span>
            <ChevronRight className="text-muted-foreground/50 mt-1 size-4 shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
