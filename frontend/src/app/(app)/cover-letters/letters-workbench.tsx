"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { GenerateForm, LetterList, type NameLookup } from "@/modules/cover-letters"
import { useJobs } from "@/modules/jobs"
import { useResumes } from "@/modules/resumes"

export function LettersWorkbench() {
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
      <GenerateForm
        resumes={resumeOptions}
        jobs={jobOptions}
        isPending={resumes.isPending || jobs.isPending}
        onGenerated={(letter) => {
          toast.success("Cover letter generated")
          router.push(`/cover-letters/${letter.id}`)
        }}
      />

      <div className="space-y-4">
        <h2 className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          Drafts
        </h2>
        <LetterList resumeNames={resumeNames} jobNames={jobNames} />
      </div>
    </div>
  )
}
