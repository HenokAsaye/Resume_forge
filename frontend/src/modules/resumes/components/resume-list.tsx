"use client"

import Link from "next/link"
import { ChevronRight, FileText, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { useResumes } from "../api/use-resumes"
import { DeleteResumeDialog } from "./delete-resume-dialog"
import { UploadResumeDialog } from "./upload-resume-dialog"

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
      <FileText className="text-muted-foreground/60 mx-auto size-6" />
      <p className="mt-3 font-medium">No résumés yet</p>
      <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
        Upload a PDF or DOCX to have it stored, then parsed into structured
        sections you can score and optimize.
      </p>
      <div className="mt-5">
        <UploadResumeDialog />
      </div>
    </div>
  )
}

export function ResumeList() {
  const { data, isPending, error } = useResumes()

  if (isPending) {
    return (
      <div className="border-border border-t">
        {[0, 1, 2].map((row) => (
          <div key={row} className="border-border flex items-center gap-4 border-b py-4">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-4 w-48" />
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
          {error instanceof Error ? error.message : "Could not load your résumés"}
        </AlertDescription>
      </Alert>
    )
  }

  if (data.length === 0) {
    return <EmptyState />
  }

  return (
    <ul className="border-border border-t">
      {data.map((resume) => (
        <li
          key={resume.id}
          className="border-border hover:bg-muted/40 group flex items-center gap-4 border-b transition-colors"
        >
          <Link
            href={`/resumes/${resume.id}`}
            className="flex min-w-0 flex-1 items-center gap-4 py-4 pl-1"
          >
            <FileText className="text-muted-foreground size-4 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{resume.name}</span>
              <span className="text-muted-foreground font-mono text-xs">
                {formatDate(resume.created_at)}
              </span>
            </span>
            <Badge variant={resume.parsed ? "secondary" : "outline"}>
              {resume.parsed ? "Parsed" : "Not parsed"}
            </Badge>
            <ChevronRight className="text-muted-foreground/50 size-4 shrink-0" />
          </Link>

          <DeleteResumeDialog
            id={resume.id}
            name={resume.name}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${resume.name}`}
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
