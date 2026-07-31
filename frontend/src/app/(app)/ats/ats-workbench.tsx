"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AnalyzeForm, ReportHistory, type NameLookup } from "@/modules/ats"
import { useJobs } from "@/modules/jobs"
import { useResumes } from "@/modules/resumes"

export function AtsWorkbench() {
  const router = useRouter()
  const resumes = useResumes()
  const jobs = useJobs()

  const resumeOptions = useMemo(
    () =>
      (resumes.data ?? []).map((resume) => ({
        id: resume.id,
        label: resume.name,
        ready: resume.parsed,
      })),
    [resumes.data]
  )

  const jobOptions = useMemo(
    () =>
      (jobs.data ?? []).map((job) => ({
        id: job.id,
        label: job.company ? `${job.title} · ${job.company}` : job.title,
        ready: true,
      })),
    [jobs.data]
  )

  const resumeNames = useMemo<NameLookup>(
    () =>
      Object.fromEntries(
        (resumes.data ?? []).map((resume) => [resume.id, resume.name])
      ),
    [resumes.data]
  )

  const jobNames = useMemo<NameLookup>(
    () =>
      Object.fromEntries((jobs.data ?? []).map((job) => [job.id, job.title])),
    [jobs.data]
  )

  return (
    <div className="space-y-10">
      <AnalyzeForm
        resumes={resumeOptions}
        jobs={jobOptions}
        isPending={resumes.isPending || jobs.isPending}
        onAnalyzed={(report) => {
          toast.success(`Scored ${Math.round(report.match_score)} / 100`)
          router.push(`/ats/${report.id}`)
        }}
      />

      <div className="space-y-4">
        <h2 className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          History
        </h2>
        <ReportHistory resumeNames={resumeNames} jobNames={jobNames} />
      </div>
    </div>
  )
}
