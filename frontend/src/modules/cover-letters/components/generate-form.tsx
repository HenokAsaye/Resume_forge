"use client"

import { useState } from "react"
import { Loader2, PenLine } from "lucide-react"
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
import { useCreateCoverLetter } from "../api/use-cover-letters"
import type { CoverLetter } from "../schemas/cover-letter.schema"

export type LetterOption = {
  id: string
  label: string
  ready: boolean
}

export function GenerateForm({
  resumes,
  jobs,
  isPending,
  onGenerated,
}: {
  resumes: LetterOption[]
  jobs: LetterOption[]
  isPending: boolean
  onGenerated?: (letter: CoverLetter) => void
}) {
  const create = useCreateCoverLetter()
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
      const letter = await create.mutateAsync({
        resume_id: resumeId,
        job_id: jobId,
      })
      onGenerated?.(letter)
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.detail
          : "Generation failed. Try again in a moment."
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

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="letter-resume">Résumé</Label>
          <Select
            items={readyResumes.map((option) => ({
              value: option.id,
              label: option.label,
            }))}
            value={resumeId}
            onValueChange={(value) => setResumeId(String(value ?? ""))}
          >
            <SelectTrigger
              id="letter-resume"
              className="w-full"
              disabled={readyResumes.length === 0}
            >
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
          <Label htmlFor="letter-job">Job</Label>
          <Select
            items={readyJobs.map((option) => ({
              value: option.id,
              label: option.label,
            }))}
            value={jobId}
            onValueChange={(value) => setJobId(String(value ?? ""))}
          >
            <SelectTrigger
              id="letter-job"
              className="w-full"
              disabled={readyJobs.length === 0}
            >
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
          disabled={create.isPending || !resumeId || !jobId}
          className="self-end"
        >
          {create.isPending ? <Loader2 className="animate-spin" /> : <PenLine />}
          Generate
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
