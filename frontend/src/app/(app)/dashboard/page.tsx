import type { Metadata } from "next"
import { FileText, Briefcase, Gauge, PenLine } from "lucide-react"

export const metadata: Metadata = {
  title: "Dashboard",
}

const upcoming = [
  {
    icon: FileText,
    label: "Résumés",
    body: "Upload a PDF or DOCX, parse it into structured sections, preview and export.",
  },
  {
    icon: Briefcase,
    label: "Jobs",
    body: "Paste a job description and have its requirements and keywords extracted.",
  },
  {
    icon: Gauge,
    label: "ATS reports",
    body: "Score a résumé against a job and see the keyword gaps behind the number.",
  },
  {
    icon: PenLine,
    label: "Cover letters",
    body: "Generate a letter from the same parsed résumé and job, then edit it inline.",
  },
]

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <div className="space-y-1.5">
        <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          Dashboard
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          You are signed in
        </h1>
        <p className="text-muted-foreground text-sm">
          Feature sections land one at a time. Here is what is coming next.
        </p>
      </div>

      <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {upcoming.map(({ icon: Icon, label, body }) => (
          <div key={label} className="border-border border-t pt-4">
            <dt className="flex items-center gap-2 font-medium">
              <Icon className="text-muted-foreground size-4" />
              {label}
            </dt>
            <dd className="text-muted-foreground mt-1 text-sm">{body}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
