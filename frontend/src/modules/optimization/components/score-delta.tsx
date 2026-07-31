"use client"

import { ArrowRight } from "lucide-react"
import { cn } from "@/shared/lib/utils"

function bandClass(score: number): string {
  if (score >= 75) {
    return "text-score-high"
  }
  if (score >= 50) {
    return "text-score-mid"
  }
  return "text-score-low"
}

function format(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}

export function ScoreDelta({
  before,
  after,
  className,
}: {
  before: number
  after: number
  className?: string
}) {
  const change = after - before
  const direction =
    change > 0 ? "improved by" : change < 0 ? "dropped by" : "unchanged at"

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
        Match score
      </p>
      <p className="flex items-baseline gap-2.5">
        <span className="text-muted-foreground tabular text-2xl font-semibold line-through decoration-2">
          {format(before)}
        </span>
        <ArrowRight aria-hidden className="text-muted-foreground size-4" />
        <span className={cn("tabular text-4xl font-semibold", bandClass(after))}>
          {format(after)}
        </span>
      </p>
      <p className="text-muted-foreground text-sm">
        {change === 0
          ? "Score unchanged after optimization."
          : `${direction} ${format(Math.abs(change))} points.`}
      </p>
    </div>
  )
}
