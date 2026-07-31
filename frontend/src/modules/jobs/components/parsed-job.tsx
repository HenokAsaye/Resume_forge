"use client"

import type { ReactNode } from "react"
import { Badge } from "@/shared/ui/badge"
import type { JobDocument } from "../schemas/job.schema"

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
      <h2 className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
        <span className="tabular">{String(index).padStart(2, "0")}</span> {title}
      </h2>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item}>
          <Badge variant="outline">{item}</Badge>
        </li>
      ))}
    </ul>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="text-muted-foreground marker:text-muted-foreground/50 list-disc space-y-1.5 pl-4 text-sm leading-relaxed">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}

export function ParsedJob({ document }: { document: JobDocument }) {
  const sections: { title: string; content: ReactNode }[] = []

  if (document.responsibilities.length > 0) {
    sections.push({
      title: "Responsibilities",
      content: <Bullets items={document.responsibilities} />,
    })
  }

  if (document.required_skills.length > 0) {
    sections.push({
      title: "Required",
      content: <Chips items={document.required_skills} />,
    })
  }

  if (document.preferred_skills.length > 0) {
    sections.push({
      title: "Preferred",
      content: <Chips items={document.preferred_skills} />,
    })
  }

  if (document.qualifications.length > 0) {
    sections.push({
      title: "Qualifications",
      content: <Bullets items={document.qualifications} />,
    })
  }

  if (document.keywords.length > 0) {
    sections.push({
      title: "ATS keywords",
      content: <Chips items={document.keywords} />,
    })
  }

  return (
    <div className="space-y-6">
      {document.seniority && (
        <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          Seniority · {document.seniority}
        </p>
      )}

      {sections.map((section, index) => (
        <Section key={section.title} index={index + 1} title={section.title}>
          {section.content}
        </Section>
      ))}
    </div>
  )
}
