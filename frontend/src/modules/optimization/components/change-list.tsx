"use client"

import { Minus, Pencil, Plus } from "lucide-react"
import { Badge } from "@/shared/ui/badge"
import { cn } from "@/shared/lib/utils"
import type { ChangeOperation, ResumeChange } from "../schemas/version.schema"

const OPERATION_ICON: Record<ChangeOperation, typeof Plus> = {
  added: Plus,
  removed: Minus,
  modified: Pencil,
}

const OPERATION_CLASS: Record<ChangeOperation, string> = {
  added: "text-score-high",
  removed: "text-score-low",
  modified: "text-score-mid",
}

function Line({
  label,
  text,
  tone,
}: {
  label: string
  text: string
  tone: "before" | "after"
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[4rem_1fr] sm:gap-4">
      <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
        {label}
      </span>
      <p
        className={cn(
          "text-sm leading-relaxed",
          tone === "before"
            ? "text-muted-foreground line-through decoration-1"
            : "text-foreground"
        )}
      >
        {text}
      </p>
    </div>
  )
}

export function ChangeList({ changes }: { changes: ResumeChange[] }) {
  if (changes.length === 0) {
    return (
      <div className="border-border rounded-lg border border-dashed px-6 py-10 text-center">
        <p className="font-medium">No changes recorded</p>
        <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
          The model returned this version without an itemised list of edits.
          Compare it against the original résumé to see what moved.
        </p>
      </div>
    )
  }

  return (
    <ol className="border-border border-t">
      {changes.map((change, index) => {
        const Icon = OPERATION_ICON[change.op]

        return (
          <li key={index} className="border-border space-y-3 border-b py-5">
            <div className="flex flex-wrap items-center gap-2">
              <Icon
                aria-hidden
                className={cn("size-3.5 shrink-0", OPERATION_CLASS[change.op])}
              />
              <span className="text-sm font-medium">{change.section}</span>
              <Badge variant="outline" className="capitalize">
                {change.op}
              </Badge>
            </div>

            <div className="space-y-2 pl-6">
              {change.before && (
                <Line label="Before" text={change.before} tone="before" />
              )}
              {change.after && (
                <Line label="After" text={change.after} tone="after" />
              )}
            </div>

            {change.reason && (
              <p className="text-muted-foreground border-border ml-6 border-l pl-3 text-sm leading-relaxed">
                {change.reason}
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}
