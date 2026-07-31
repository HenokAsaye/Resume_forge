"use client"

import Link from "next/link"
import { ArrowLeft, Download, Loader2, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ApiError } from "@/shared/api/client"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import {
  resumeDownloadUrl,
  useParsedResume,
  useParseResume,
  useResume,
} from "../api/use-resumes"
import { DeleteResumeDialog } from "./delete-resume-dialog"
import { ParsedResume } from "./parsed-resume"

const dateFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
})

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : dateFormat.format(date)
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-px w-full" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  )
}

export function ResumeDetail({ id }: { id: string }) {
  const resume = useResume(id)
  const parse = useParseResume()

  const isParsed = Boolean(resume.data?.parsed_json)
  const parsed = useParsedResume(id, isParsed)

  async function onParse() {
    try {
      await parse.mutateAsync(id)
      toast.success("Résumé parsed")
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.detail : "Parsing failed. Try again."
      )
    }
  }

  if (resume.isPending) {
    return <DetailSkeleton />
  }

  if (resume.error) {
    const notFound = resume.error instanceof ApiError && resume.error.isNotFound

    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            {notFound
              ? "This résumé no longer exists."
              : resume.error instanceof Error
                ? resume.error.message
                : "Could not load this résumé"}
          </AlertDescription>
        </Alert>
        <Button variant="outline" nativeButton={false} render={<Link href="/resumes" />}>
          <ArrowLeft />
          Back to résumés
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href="/resumes"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono text-xs tracking-widest uppercase transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Résumés
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {resume.data.name}
            </h1>
            <p className="text-muted-foreground font-mono text-xs">
              Added {formatDate(resume.data.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<a href={resumeDownloadUrl(id)} download />}
            >
              <Download />
              Original
            </Button>

            <DeleteResumeDialog
              id={id}
              name={resume.data.name}
              redirectTo="/resumes"
              trigger={
                <Button variant="outline" size="icon" aria-label="Delete résumé">
                  <Trash2 />
                </Button>
              }
            />

            <Button onClick={onParse} disabled={parse.isPending}>
              {parse.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {isParsed ? "Re-parse" : "Parse"}
            </Button>
          </div>
        </div>
      </div>

      {!isParsed && !parse.isPending && (
        <div className="border-border rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">Not parsed yet</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
            Parsing extracts the text and turns it into structured sections —
            contact, skills, experience — which everything downstream scores
            against.
          </p>
        </div>
      )}

      {parse.isPending && (
        <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Extracting and structuring this résumé. This can take a few seconds.
        </div>
      )}

      {isParsed && parsed.isPending && <DetailSkeleton />}

      {isParsed && parsed.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {parsed.error instanceof Error
              ? parsed.error.message
              : "Could not load the parsed résumé"}
          </AlertDescription>
        </Alert>
      )}

      {parsed.data && <ParsedResume document={parsed.data} />}
    </div>
  )
}
