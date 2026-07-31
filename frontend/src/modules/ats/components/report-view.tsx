"use client"

import type { ReactNode } from "react"
import { Check, Minus, TriangleAlert } from "lucide-react"
import { Badge } from "@/shared/ui/badge"
import type { ATSReport } from "../schemas/ats.schema"
import { ScoreMeter } from "./score-meter"

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

export function formatReportDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormat.format(date)
}

function Section({
  index,
  title,
  children,
}: {
  index: number
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-border grid gap-4 border-t pt-5 sm:grid-cols-[9rem_1fr] sm:gap-8">
      <h3 className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
        <span className="tabular">{String(index).padStart(2, "0")}</span> {title}
      </h3>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

function PointList({
  items,
  icon,
  iconClass,
}: {
  items: string[]
  icon: typeof Check
  iconClass: string
}) {
  const Icon = icon

  return (
    <ul className="space-y-2 text-sm leading-relaxed">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2.5">
          <Icon aria-hidden className={`mt-0.5 size-3.5 shrink-0 ${iconClass}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function ReportView({
  report,
  resumeName,
  jobName,
}: {
  report: ATSReport
  resumeName?: string
  jobName?: string
}) {
  const sections: { title: string; content: ReactNode }[] = []

  if (report.missing_keywords.length > 0) {
    sections.push({
      title: "Missing",
      content: (
        <ul className="flex flex-wrap gap-1.5">
          {report.missing_keywords.map((keyword) => (
            <li
              key={keyword}
              className="border-score-low/40 text-score-low flex items-center gap-1 rounded-md border border-dashed px-2 py-0.5 font-mono text-xs"
            >
              <Minus aria-hidden className="size-3" />
              {keyword}
            </li>
          ))}
        </ul>
      ),
    })
  }

  if (report.strengths.length > 0) {
    sections.push({
      title: "Strengths",
      content: (
        <PointList
          items={report.strengths}
          icon={Check}
          iconClass="text-score-high"
        />
      ),
    })
  }

  if (report.weaknesses.length > 0) {
    sections.push({
      title: "Weaknesses",
      content: (
        <PointList
          items={report.weaknesses}
          icon={TriangleAlert}
          iconClass="text-score-mid"
        />
      ),
    })
  }

  if (report.suggestions.length > 0) {
    sections.push({
      title: "Suggestions",
      content: (
        <ol className="text-muted-foreground marker:text-muted-foreground/50 list-decimal space-y-2 pl-4 text-sm leading-relaxed">
          {report.suggestions.map((suggestion, index) => (
            <li key={index}>{suggestion}</li>
          ))}
        </ol>
      ),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 space-y-1">
          <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
            {formatReportDate(report.created_at)}
          </p>
          <p className="truncate font-medium">
            {resumeName ?? "Résumé"}
            <span className="text-muted-foreground font-normal"> against </span>
            {jobName ?? "job"}
          </p>
          {report.analysis_stage === "optimized" && (
            <Badge variant="secondary">Optimized version</Badge>
          )}
        </div>

        <ScoreMeter score={report.match_score} className="w-full max-w-xs" />
      </div>

      {sections.map((section, index) => (
        <Section key={section.title} index={index + 1} title={section.title}>
          {section.content}
        </Section>
      ))}
    </div>
  )
}
