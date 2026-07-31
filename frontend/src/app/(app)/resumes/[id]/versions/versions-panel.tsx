"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useJobs } from "@/modules/jobs"
import { ExportButtons, OptimizeDialog, VersionTimeline } from "@/modules/optimization"
import { useResume } from "@/modules/resumes"
import { Skeleton } from "@/shared/ui/skeleton"

export function VersionsPanel({ resumeId }: { resumeId: string }) {
  const router = useRouter()
  const resume = useResume(resumeId)
  const jobs = useJobs()

  const jobOptions = useMemo(
    () =>
      (jobs.data ?? []).map((job) => ({
        id: job.id,
        label: job.company ? `${job.title} · ${job.company}` : job.title,
      })),
    [jobs.data]
  )

  const isParsed = Boolean(resume.data?.parsed_json)

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href={`/resumes/${resumeId}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono text-xs tracking-widest uppercase transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Résumé
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {resume.isPending ? (
                <Skeleton className="h-7 w-56" />
              ) : (
                (resume.data?.name ?? "Résumé")
              )}
            </h1>
            <p className="text-muted-foreground text-sm">
              Optimized versions, newest first. The original is never overwritten.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isParsed && <ExportButtons resumeId={resumeId} />}
            <OptimizeDialog
              resumeId={resumeId}
              jobs={jobOptions}
              onOptimized={(result) => {
                const change = result.final_ats.match_score - result.initial_ats.match_score
                toast.success(
                  change === 0
                    ? "Optimized — score unchanged"
                    : `Optimized — score ${change > 0 ? "up" : "down"} ${Math.abs(Math.round(change))} points`
                )
                router.push(`/resumes/${resumeId}/versions/${result.version.id}`)
              }}
            />
          </div>
        </div>
      </div>

      {!resume.isPending && !isParsed && (
        <div className="border-border rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">Parse this résumé first</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
            Optimization rewrites the structured sections, so it needs a parsed
            résumé and a parsed job on the other side.
          </p>
        </div>
      )}

      <VersionTimeline resumeId={resumeId} />
    </div>
  )
}
