"use client"

import type { ReactNode } from "react"
import { Badge } from "@/shared/ui/badge"
import type { ResumeDocument } from "../schemas/resume.schema"

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
    <section className="border-border grid gap-4 border-t pt-5 sm:grid-cols-[8rem_1fr] sm:gap-8">
      <h2 className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
        <span className="tabular">{String(index).padStart(2, "0")}</span> {title}
      </h2>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

function DateRange({ start, end }: { start: string; end: string }) {
  const range = [start, end].filter(Boolean).join(" – ")
  return range ? (
    <span className="text-muted-foreground shrink-0 font-mono text-xs">{range}</span>
  ) : null
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

export function ParsedResume({ document }: { document: ResumeDocument }) {
  const { contact, summary, skills, experience, education, projects, certifications } =
    document

  const contactLine = [contact.email, contact.phone, contact.location]
    .filter(Boolean)
    .join(" · ")

  const sections: { title: string; content: ReactNode }[] = []

  if (summary) {
    sections.push({
      title: "Summary",
      content: <p className="text-sm leading-relaxed">{summary}</p>,
    })
  }

  if (skills.length > 0) {
    sections.push({ title: "Skills", content: <Chips items={skills} /> })
  }

  if (experience.length > 0) {
    sections.push({
      title: "Experience",
      content: (
        <ol className="space-y-5">
          {experience.map((role, index) => (
            <li key={`${role.company}-${role.title}-${index}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="font-medium">
                  {role.title}
                  {role.company && (
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      · {role.company}
                    </span>
                  )}
                </p>
                <DateRange start={role.start} end={role.end} />
              </div>
              {role.bullets.length > 0 && (
                <ul className="text-muted-foreground marker:text-muted-foreground/50 mt-2 list-disc space-y-1.5 pl-4 text-sm leading-relaxed">
                  {role.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex}>{bullet}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      ),
    })
  }

  if (projects.length > 0) {
    sections.push({
      title: "Projects",
      content: (
        <ol className="space-y-4">
          {projects.map((project, index) => (
            <li key={`${project.name}-${index}`}>
              <p className="font-medium">{project.name}</p>
              {project.description && (
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  {project.description}
                </p>
              )}
              {project.tech.length > 0 && (
                <div className="mt-2">
                  <Chips items={project.tech} />
                </div>
              )}
            </li>
          ))}
        </ol>
      ),
    })
  }

  if (education.length > 0) {
    sections.push({
      title: "Education",
      content: (
        <ol className="space-y-3">
          {education.map((entry, index) => (
            <li
              key={`${entry.institution}-${index}`}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
            >
              <p className="font-medium">
                {entry.degree}
                {entry.institution && (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    · {entry.institution}
                  </span>
                )}
              </p>
              <DateRange start={entry.start} end={entry.end} />
            </li>
          ))}
        </ol>
      ),
    })
  }

  if (certifications.length > 0) {
    sections.push({
      title: "Certifications",
      content: <Chips items={certifications} />,
    })
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        {contact.name && (
          <p className="text-xl font-semibold tracking-tight">{contact.name}</p>
        )}
        {contactLine && (
          <p className="text-muted-foreground text-sm">{contactLine}</p>
        )}
        {contact.links.length > 0 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
            {contact.links.map((link) => (
              <li key={link} className="text-muted-foreground truncate">
                {link}
              </li>
            ))}
          </ul>
        )}
      </header>

      {sections.map((section, index) => (
        <Section key={section.title} index={index + 1} title={section.title}>
          {section.content}
        </Section>
      ))}
    </div>
  )
}
