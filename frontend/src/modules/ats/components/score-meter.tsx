"use client"

import { cn } from "@/shared/lib/utils"
import {
  formatScore,
  scoreBackgroundClass,
  scoreLabel,
  scoreTextClass,
} from "../lib/score"

export function ScoreMeter({
  score,
  size = "default",
  className,
}: {
  score: number
  size?: "sm" | "default"
  className?: string
}) {
  const clamped = Math.min(Math.max(score, 0), 100)

  return (
    <div className={cn("space-y-2", className)}>
      <p className="flex items-baseline gap-2">
        <span
          className={cn(
            "tabular font-semibold",
            scoreTextClass(clamped),
            size === "sm" ? "text-2xl" : "text-5xl"
          )}
        >
          {formatScore(clamped)}
        </span>
        <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          / 100 · {scoreLabel(clamped)}
        </span>
      </p>

      <div
        role="meter"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="ATS match score"
        className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
      >
        <div
          className={cn("h-full rounded-full", scoreBackgroundClass(clamped))}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
