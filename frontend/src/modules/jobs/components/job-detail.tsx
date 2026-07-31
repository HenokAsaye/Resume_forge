"use client"

import Link from "next/link"
import { ArrowLeft, ExternalLink, Loader2, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ApiError } from "@/shared/api/client"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { useJob, useParseJob } from "../api/use-jobs"
import { DeleteJobDialog } from "./delete-job-dialog"
import { ParsedJob } from "./parsed-job"

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
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-px w-full" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  )
}

export function JobDetail({ id }: { id: string }) {
  const job = useJob(id)
  const parse = useParseJob()

  async function onParse() {
    try {
      await parse.mutateAsync(id)
      toast.success("Job parsed")
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.detail : "Parsing failed. Try again."
      )
    }
  }

  if (job.isPending) {
    return <DetailSkeleton />
  }

  if (job.error) {
    const notFound = job.error instanceof ApiError && job.error.isNotFound

    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            {notFound
              ? "This job no longer exists."
              : job.error instanceof Error
                ? job.error.message
                : "Could not load this job"}
          </AlertDescription>
        </Alert>
        <Button variant="outline" nativeButton={false} render={<Link href="/jobs" />}>
          <ArrowLeft />
          Back to jobs
        </Button>
      </div>
    )
  }

  const parsed = job.data.parsed_json

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href="/jobs"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono text-xs tracking-widest uppercase transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Jobs
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {job.data.title}
            </h1>
            <p className="text-muted-foreground font-mono text-xs">
              {job.data.company ? `${job.data.company} · ` : ""}
              Added {formatDate(job.data.created_at)}
            </p>
            {job.data.url && (
              <a
                href={job.data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1.5 text-sm hover:underline"
              >
                Original posting
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DeleteJobDialog
              id={id}
              title={job.data.title}
              redirectTo="/jobs"
              trigger={
                <Button variant="outline" size="icon" aria-label="Delete job">
                  <Trash2 />
                </Button>
              }
            />

            <Button onClick={onParse} disabled={parse.isPending}>
              {parse.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {parsed ? "Re-parse" : "Parse"}
            </Button>
          </div>
        </div>
      </div>

      {parse.isPending && (
        <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Extracting requirements and keywords from this posting.
        </div>
      )}

      {!parse.isPending && (
        <Tabs defaultValue={parsed ? "parsed" : "raw"}>
          <TabsList>
            <TabsTrigger value="parsed" disabled={!parsed}>
              Requirements
            </TabsTrigger>
            <TabsTrigger value="raw">Posting</TabsTrigger>
          </TabsList>

          <TabsContent value="parsed" className="pt-6">
            {parsed ? (
              <ParsedJob document={parsed} />
            ) : (
              <div className="border-border rounded-lg border border-dashed px-6 py-10 text-center">
                <p className="font-medium">Not parsed yet</p>
                <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
                  Parsing turns the posting into required skills, qualifications
                  and ATS keywords — the half of the comparison a résumé gets
                  scored against.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="raw" className="pt-6">
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {job.data.raw_text}
            </p>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
