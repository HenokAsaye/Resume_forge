"use client"

import Link from "next/link"
import { ArrowLeft, Trash2 } from "lucide-react"
import { ApiError } from "@/shared/api/client"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import {
  DeleteLetterDialog,
  LetterEditor,
  formatLetterDate,
  useCoverLetter,
} from "@/modules/cover-letters"
import { useJob } from "@/modules/jobs"
import { useResume } from "@/modules/resumes"

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "cover-letter"
  )
}

export function LetterPanel({ id }: { id: string }) {
  const letter = useCoverLetter(id)
  const resume = useResume(letter.data?.resume_id ?? "")
  const job = useJob(letter.data?.job_id ?? "")

  if (letter.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (letter.error) {
    const notFound = letter.error instanceof ApiError && letter.error.isNotFound

    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            {notFound
              ? "This cover letter no longer exists."
              : letter.error instanceof Error
                ? letter.error.message
                : "Could not load this cover letter"}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/cover-letters" />}
        >
          <ArrowLeft />
          Back to cover letters
        </Button>
      </div>
    )
  }

  const jobTitle = job.data?.title
  const filename = `${slugify(jobTitle ?? "cover-letter")}.txt`

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href="/cover-letters"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono text-xs tracking-widest uppercase transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Cover letters
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {jobTitle ?? "Cover letter"}
            </h1>
            <p className="text-muted-foreground font-mono text-xs">
              {resume.data?.name ? `${resume.data.name} · ` : ""}
              Edited {formatLetterDate(letter.data.updated_at)}
            </p>
          </div>

          <DeleteLetterDialog
            id={id}
            redirectTo="/cover-letters"
            trigger={
              <Button variant="outline" size="icon" aria-label="Delete cover letter">
                <Trash2 />
              </Button>
            }
          />
        </div>
      </div>

      <LetterEditor letter={letter.data} filename={filename} />
    </div>
  )
}
