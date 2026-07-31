"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ApiError } from "@/shared/api/client"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { ReportView, useAtsReport } from "@/modules/ats"
import { useJob } from "@/modules/jobs"
import { useResume } from "@/modules/resumes"

export function ReportPanel({ id }: { id: string }) {
  const report = useAtsReport(id)
  const resume = useResume(report.data?.resume_id ?? "")
  const job = useJob(report.data?.job_id ?? "")

  if (report.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-px w-full" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    )
  }

  if (report.error) {
    const notFound = report.error instanceof ApiError && report.error.isNotFound

    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            {notFound
              ? "This report no longer exists."
              : report.error instanceof Error
                ? report.error.message
                : "Could not load this report"}
          </AlertDescription>
        </Alert>
        <Button variant="outline" nativeButton={false} render={<Link href="/ats" />}>
          <ArrowLeft />
          Back to reports
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Link
        href="/ats"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono text-xs tracking-widest uppercase transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        ATS reports
      </Link>

      <ReportView
        report={report.data}
        resumeName={resume.data?.name}
        jobName={job.data?.title}
      />
    </div>
  )
}
