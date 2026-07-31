"use client"

import { useState, type ReactElement } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { ApiError } from "@/shared/api/client"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"
import { Label } from "@/shared/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { useOptimizeResume } from "../api/use-optimization"
import type { OptimizationResult } from "../schemas/version.schema"

export type JobOption = {
  id: string
  label: string
}

export function OptimizeDialog({
  resumeId,
  jobs,
  trigger,
  onOptimized,
}: {
  resumeId: string
  jobs: JobOption[]
  trigger?: ReactElement
  onOptimized?: (result: OptimizationResult) => void
}) {
  const optimize = useOptimizeResume(resumeId)
  const [open, setOpen] = useState(false)
  const [jobId, setJobId] = useState("")
  const [error, setError] = useState<string | null>(null)

  function onOpenChange(next: boolean) {
    if (optimize.isPending) {
      return
    }
    setOpen(next)
    if (!next) {
      setJobId("")
      setError(null)
    }
  }

  async function onSubmit() {
    if (!jobId) {
      setError("Choose a job first")
      return
    }

    setError(null)

    try {
      const result = await optimize.mutateAsync({ job_id: jobId })
      onOpenChange(false)
      onOptimized?.(result)
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.detail
          : "Optimization failed. Try again in a moment."
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={trigger ?? <Button>
          <Sparkles />
          Optimize
        </Button>}
      />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Optimize against a job</DialogTitle>
          <DialogDescription>
            This scores the résumé, rewrites it for the posting, then scores it
            again. Both reports are kept alongside the new version.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="optimize-job">Job</Label>
          <Select
            items={jobs.map((job) => ({ value: job.id, label: job.label }))}
            value={jobId}
            onValueChange={(value) => setJobId(String(value ?? ""))}
          >
            <SelectTrigger
              id="optimize-job"
              className="w-full"
              disabled={jobs.length === 0 || optimize.isPending}
            >
              <SelectValue placeholder="Select a parsed job" />
            </SelectTrigger>
            <SelectContent>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {jobs.length === 0 && (
            <p className="text-muted-foreground text-xs">
              Add and parse a job first.
            </p>
          )}
        </div>

        {optimize.isPending && (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Two analyses and a rewrite — this takes longer than parsing.
          </p>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            disabled={optimize.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={optimize.isPending || !jobId}>
            {optimize.isPending && <Loader2 className="animate-spin" />}
            Optimize
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
