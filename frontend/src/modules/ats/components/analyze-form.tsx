"use client"

import { useState } from "react"
import { Gauge, Loader2 } from "lucide-react"
import { ApiError } from "@/shared/api/client"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Skeleton } from "@/shared/ui/skeleton"
import type { ATSReport } from "../schemas/ats.schema"
import { useAnalyzeAts } from "../api/use-ats"

export type AnalyzeOption = {
  id: string
  label: string
  ready: boolean
}

function unparsedNote(options: AnalyzeOption[], noun: string): string | null {
  const unparsed = options.filter((option) => !option.ready).length
  if (unparsed === 0) {
    return null
  }
  return `${unparsed} ${noun}${unparsed === 1 ? "" : "s"} still need parsing before ${unparsed === 1 ? "it" : "they"} can be scored.`
}

export function AnalyzeForm({
  resumes,
  jobs,
  isPending,
  onAnalyzed,
}: {
  resumes: AnalyzeOption[]
  jobs: AnalyzeOption[]
  isPending: boolean
  onAnalyzed?: (report: ATSReport) => void
}) {
  const analyze = useAnalyzeAts()
  const [resumeId, setResumeId] = useState("")
  const [jobId, setJobId] = useState("")
  const [error, setError] = useState<string | null>(null)

  const readyResumes = resumes.filter((option) => option.ready)
  const readyJobs = jobs.filter((option) => option.ready)

  async function onSubmit() {
    if (!resumeId || !jobId) {
      setError("Choose a résumé and a job first")
      return
    }

    setError(null)

    try {
      const report = await analyze.mutateAsync({
        resume_id: resumeId,
        job_id: jobId,
      })
      onAnalyzed?.(report)
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.detail
          : "Analysis failed. Try again in a moment."
      )
    }
  }

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
        <Skeleton className="h-8 w-28 self-end" />
      </div>
    )
  }

  const notes = [
    unparsedNote(resumes, "résumé"),
    unparsedNote(jobs, "job"),
  ].filter(Boolean)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="ats-resume">Résumé</Label>
          <Select
            items={readyResumes.map((option) => ({
              value: option.id,
              label: option.label,
            }))}
            value={resumeId}
            onValueChange={(value) => setResumeId(String(value ?? ""))}
          >
            <SelectTrigger id="ats-resume" className="w-full" disabled={readyResumes.length === 0}>
              <SelectValue placeholder="Select a parsed résumé" />
            </SelectTrigger>
            <SelectContent>
              {readyResumes.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ats-job">Job</Label>
          <Select
            items={readyJobs.map((option) => ({
              value: option.id,
              label: option.label,
            }))}
            value={jobId}
            onValueChange={(value) => setJobId(String(value ?? ""))}
          >
            <SelectTrigger id="ats-job" className="w-full" disabled={readyJobs.length === 0}>
              <SelectValue placeholder="Select a parsed job" />
            </SelectTrigger>
            <SelectContent>
              {readyJobs.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={onSubmit}
          disabled={analyze.isPending || !resumeId || !jobId}
          className="self-end"
        >
          {analyze.isPending ? <Loader2 className="animate-spin" /> : <Gauge />}
          Analyze
        </Button>
      </div>

      {notes.length > 0 && (
        <p className="text-muted-foreground text-xs">{notes.join(" ")}</p>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
