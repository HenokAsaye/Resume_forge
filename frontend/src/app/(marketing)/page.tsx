import { ArrowRight } from "lucide-react"
import { ButtonLink } from "@/shared/ui/button-link"
import { ScorePanel } from "@/shared/ui/score-panel"

const matched = ["Python", "PostgreSQL", "REST", "Docker", "CI/CD"]
const missing = ["Kubernetes", "gRPC", "Terraform"]

const pipeline = [
  {
    step: "01",
    label: "Parse",
    title: "Your file becomes structured data",
    body: "PDF and DOCX are extracted into contact, experience, skills, education and projects — the same shape an applicant tracking system builds internally.",
  },
  {
    step: "02",
    label: "Compare",
    title: "The job description is parsed too",
    body: "Requirements and keywords are pulled from the posting, then matched field by field against your résumé rather than by keyword count alone.",
  },
  {
    step: "03",
    label: "Rewrite",
    title: "Bullets are rewritten, not invented",
    body: "Suggestions are grounded in experience you already listed. Every revision is a new version, so you can diff it and roll back.",
  },
]

const surface = [
  {
    label: "Match score",
    body: "A single number per résumé-and-job pair, with the keyword gaps that produced it.",
  },
  {
    label: "Version history",
    body: "Every optimization is kept. Compare any two side by side.",
  },
  {
    label: "Cover letters",
    body: "Generated from the same parsed résumé and job, editable inline.",
  },
  {
    label: "Export",
    body: "Download the tailored résumé as PDF or DOCX when it is ready to send.",
  },
]

export default function LandingPage() {
  return (
    <>
      <section className="border-border grid border-b lg:grid-cols-[1.05fr_0.95fr]">
        <div className="border-border flex flex-col justify-center gap-6 px-5 py-14 lg:border-r lg:py-20">
          <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
            Résumé → Scanner → Recruiter
          </p>

          <h1 className="max-w-xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl">
            Most résumés are rejected by software that never explains why.
          </h1>

          <p className="text-muted-foreground max-w-lg text-base">
            ResumeAI reads a job description the way an applicant tracking system
            does, scores your résumé against it, and rewrites the weak lines using
            experience you already have.
          </p>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <ButtonLink size="lg" href="/register">
              Score my résumé
              <ArrowRight />
            </ButtonLink>
            <ButtonLink size="lg" variant="outline" href="/login">
              Sign in
            </ButtonLink>
          </div>

          <p className="text-muted-foreground font-mono text-xs">
            PDF or DOCX · no template required
          </p>
        </div>

        <div className="bg-card/40 flex items-center px-5 py-10 lg:py-20">
          <ScorePanel matched={matched} missing={missing} />
        </div>
      </section>

      <section id="analysis" className="border-border border-b px-5 py-14">
        <SectionHeading eyebrow="What the scanner sees" number="00" />
        <div className="bg-border mt-8 grid gap-px sm:grid-cols-3">
          <Stat value="6s" label="Median recruiter scan" />
          <Stat value="75%" label="Filtered before a human reads" />
          <Stat value="1" label="Résumé that fits every job" negated />
        </div>
      </section>

      <section id="pipeline" className="border-border border-b">
        <div className="px-5 pt-14 pb-6">
          <SectionHeading eyebrow="Pipeline" number="01" />
        </div>
        <ol>
          {pipeline.map(({ step, label, title, body }) => (
            <li
              key={step}
              className="border-border grid gap-3 border-t px-5 py-8 sm:grid-cols-[7rem_1fr] sm:gap-8"
            >
              <div className="flex items-baseline gap-3 sm:flex-col sm:gap-1">
                <span className="text-primary font-mono text-sm tabular">
                  {step}
                </span>
                <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
                  {label}
                </span>
              </div>
              <div className="max-w-2xl space-y-2">
                <h3 className="text-lg font-medium tracking-tight">{title}</h3>
                <p className="text-muted-foreground text-sm">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="surface" className="border-border border-b px-5 py-14">
        <SectionHeading eyebrow="Surface" number="02" />
        <dl className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {surface.map(({ label, body }) => (
            <div key={label} className="border-border border-t pt-4">
              <dt className="font-medium">{label}</dt>
              <dd className="text-muted-foreground mt-1 text-sm">{body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-col gap-5 px-5 py-16 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="max-w-md text-2xl font-semibold tracking-tight">
            Find out what the scanner already knows.
          </h2>
          <p className="text-muted-foreground font-mono text-xs tracking-wide">
            One résumé · one job description · one score
          </p>
        </div>
        <ButtonLink size="lg" href="/register">
          Get started
          <ArrowRight />
        </ButtonLink>
      </section>
    </>
  )
}

function SectionHeading({
  eyebrow,
  number,
}: {
  eyebrow: string
  number: string
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-muted-foreground font-mono text-xs tabular">
        {number}
      </span>
      <h2 className="font-mono text-xs tracking-widest uppercase">{eyebrow}</h2>
      <span aria-hidden className="bg-border h-px flex-1" />
    </div>
  )
}

function Stat({
  value,
  label,
  negated,
}: {
  value: string
  label: string
  negated?: boolean
}) {
  return (
    <div className="bg-background px-1 py-4 sm:px-5 sm:first:pl-0">
      <p
        className={`tabular text-3xl font-semibold tracking-tight ${
          negated ? "text-muted-foreground line-through decoration-2" : ""
        }`}
      >
        {value}
      </p>
      <p className="text-muted-foreground mt-1 text-sm">{label}</p>
    </div>
  )
}
