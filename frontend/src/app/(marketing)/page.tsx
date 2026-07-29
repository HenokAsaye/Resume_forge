import {
  ArrowRight,
  FileSearch,
  Gauge,
  PenLine,
  Sparkles,
  Target,
  Upload,
} from "lucide-react"
import { ButtonLink } from "@/shared/ui/button-link"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"

const features = [
  {
    icon: Gauge,
    title: "ATS match score",
    body: "See how a résumé scores against a specific job before a recruiter ever reads it, with the keywords you are missing called out.",
  },
  {
    icon: Target,
    title: "Targeted optimization",
    body: "Rewrite bullets against the job description and keep every version, so you can compare and roll back.",
  },
  {
    icon: PenLine,
    title: "Cover letters",
    body: "Generate a letter grounded in your own experience and the role you are applying to, then edit it inline.",
  },
  {
    icon: FileSearch,
    title: "Structured parsing",
    body: "Your PDF or DOCX becomes structured data — contact, experience, skills, education — ready to analyze.",
  },
]

const steps = [
  {
    icon: Upload,
    title: "Upload your résumé",
    body: "PDF or DOCX. It is parsed into structured sections automatically.",
  },
  {
    icon: Target,
    title: "Add the job",
    body: "Paste a job description. Requirements and keywords are extracted for you.",
  },
  {
    icon: Sparkles,
    title: "Optimize and apply",
    body: "Get a match score, apply suggested rewrites, and export a tailored résumé and cover letter.",
  },
]

export default function LandingPage() {
  return (
    <>
      <section className="border-border/80 relative overflow-hidden border-b">
        <div
          aria-hidden
          className="from-accent/60 pointer-events-none absolute inset-0 bg-gradient-to-b to-transparent"
        />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-28">
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="size-3.5" />
            Built on your real experience, not templates
          </Badge>

          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Tailor your résumé to the job,
            <span className="text-primary"> before you apply</span>
          </h1>

          <p className="text-muted-foreground max-w-2xl text-base sm:text-lg">
            Most résumés are filtered out by software, not people. ResumeAI scores
            yours against the job description, shows what is missing, and rewrites it
            with your own experience intact.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink size="lg" href="/register">
              Get started free
              <ArrowRight />
            </ButtonLink>
            <ButtonLink size="lg" variant="outline" href="/login">
              Sign in
            </ButtonLink>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
      >
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything between your résumé and the interview
          </h2>
          <p className="text-muted-foreground mt-3">
            Four tools that work off the same parsed résumé, so nothing is retyped.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <CardHeader>
                <span className="bg-accent text-accent-foreground mb-1 flex size-9 items-center justify-center rounded-lg">
                  <Icon className="size-4.5" />
                </span>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {body}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-border/80 bg-card/40 border-y"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              How it works
            </h2>
            <p className="text-muted-foreground mt-3">
              Three steps from an untargeted résumé to an application worth sending.
            </p>
          </div>

          <ol className="grid gap-6 sm:grid-cols-3">
            {steps.map(({ icon: Icon, title, body }, index) => (
              <li key={title} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="bg-primary text-primary-foreground tabular flex size-8 items-center justify-center rounded-full text-sm font-semibold">
                    {index + 1}
                  </span>
                  <Icon className="text-muted-foreground size-4" />
                </div>
                <h3 className="font-medium">{title}</h3>
                <p className="text-muted-foreground text-sm">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
            <h2 className="max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
              Stop guessing why you never heard back
            </h2>
            <p className="text-muted-foreground max-w-lg text-sm sm:text-base">
              Upload one résumé and one job description to see your first match score.
            </p>
            <ButtonLink size="lg" href="/register">
              Create your account
              <ArrowRight />
            </ButtonLink>
          </CardContent>
        </Card>
      </section>
    </>
  )
}
