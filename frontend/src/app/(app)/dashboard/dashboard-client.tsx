"use client"

import Link from "next/link"
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleUserRound,
  FileText,
  Gauge,
  PenLine,
  Sparkles,
  Target,
} from "lucide-react"
import { useCurrentUser } from "@/modules/auth"
import { useAtsReports } from "@/modules/ats"
import { useCoverLetters } from "@/modules/cover-letters"
import { useJobs } from "@/modules/jobs"
import {
  useParsedResume,
  useResumes,
  type ResumeDocument,
} from "@/modules/resumes"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { ButtonLink } from "@/shared/ui/button-link"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Skeleton } from "@/shared/ui/skeleton"

const dateFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
})

function readinessScore(resume: ResumeDocument): number {
  let score = 0
  if (resume.contact.name) score += 8
  if (resume.contact.email) score += 6
  if (resume.contact.phone) score += 4
  if (resume.contact.location) score += 4
  if (resume.contact.links.length) score += 5
  if (resume.summary) score += 14
  score += Math.min(resume.skills.length * 3, 18)
  if (resume.experience.length) score += 22
  if (resume.education.length) score += 9
  if (resume.projects.length) score += 6
  if (resume.certifications.length) score += 4
  return Math.min(score, 100)
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <Skeleton className="h-72 rounded-3xl" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-72 rounded-2xl lg:col-span-3" />
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
      </div>
    </div>
  )
}

export function DashboardClient() {
  const user = useCurrentUser()
  const resumes = useResumes()
  const jobs = useJobs()
  const reports = useAtsReports()
  const letters = useCoverLetters()

  const sortedResumes = resumes.data
    ?.slice()
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    )
  const latestResume = sortedResumes?.[0]
  const profileResume =
    sortedResumes?.find((resume) => resume.parsed) ?? latestResume
  const profile = useParsedResume(
    profileResume?.id ?? "",
    Boolean(profileResume?.parsed)
  )

  if (
    user.isPending ||
    resumes.isPending ||
    jobs.isPending ||
    reports.isPending ||
    letters.isPending
  ) {
    return <DashboardSkeleton />
  }

  const document = profile.data
  const displayName =
    document?.contact.name ||
    user.data?.name ||
    user.data?.email.split("@")[0] ||
    "Candidate"
  const role = document?.experience[0]?.title || "Your next role starts here"
  const readiness = document ? readinessScore(document) : 0
  const sortedReports = reports.data
    ?.slice()
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    )
  const bestScore = sortedReports?.length
    ? Math.max(...sortedReports.map((report) => report.match_score))
    : null
  const averageScore = sortedReports?.length
    ? Math.round(
        sortedReports.reduce((total, report) => total + report.match_score, 0) /
          sortedReports.length
      )
    : null
  const jobNames = new Map(
    jobs.data?.map((job) => [job.id, job.title]) ?? []
  )

  const nextAction = !latestResume
    ? {
        label: "Add your first résumé",
        body: "Upload a PDF or DOCX to build your candidate profile.",
        href: "/resumes",
      }
    : !latestResume.parsed
      ? {
          label: "Structure your résumé",
          body: "Parse your latest résumé so the workspace can understand your experience.",
          href: `/resumes/${latestResume.id}`,
        }
      : !jobs.data?.length
        ? {
            label: "Add a target role",
            body: "Save a job description to uncover requirements and keywords.",
            href: "/jobs",
          }
        : !sortedReports?.length
          ? {
              label: "Run your first match",
              body: "Compare your résumé with a role and find the highest-impact gaps.",
              href: "/ats",
            }
          : {
              label: "Build on your best match",
              body: "Optimize your résumé for a saved role and keep every version.",
              href: latestResume
                ? `/resumes/${latestResume.id}/versions`
                : "/resumes",
            }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="relative isolate overflow-hidden rounded-3xl border bg-[linear-gradient(135deg,var(--card),color-mix(in_oklab,var(--primary)_8%,var(--card)))] p-6 shadow-sm sm:p-8">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-50 [background-image:radial-gradient(circle_at_1px_1px,color-mix(in_oklab,var(--foreground)_12%,transparent)_1px,transparent_0)] [background-size:22px_22px]"
        />
        <div
          aria-hidden
          className="bg-primary/10 absolute -top-24 -right-24 -z-10 size-72 rounded-full blur-3xl"
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-foreground text-background flex size-14 shrink-0 items-center justify-center rounded-2xl font-mono text-lg font-semibold shadow-sm">
                {initials(displayName) || <CircleUserRound />}
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">
                  Candidate workspace
                </p>
                <h1 className="truncate text-2xl font-semibold sm:text-3xl">
                  {displayName}
                </h1>
                <p className="text-muted-foreground mt-0.5 truncate text-sm">
                  {role}
                </p>
              </div>
            </div>

            <p className="text-muted-foreground max-w-2xl text-sm leading-6 sm:text-base">
              {document?.summary ||
                "Your profile will take shape here after you upload and parse a résumé. Every match, optimization, and letter will build from that source of truth."}
            </p>

            <div className="flex flex-wrap gap-2">
              {document?.skills.slice(0, 8).map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="bg-background/70 backdrop-blur"
                >
                  {skill}
                </Badge>
              ))}
              {document && document.skills.length > 8 && (
                <Badge variant="outline">+{document.skills.length - 8}</Badge>
              )}
              {!document && (
                <Badge variant="outline">Profile waiting for résumé</Badge>
              )}
            </div>
          </div>

          <div className="bg-background/75 rounded-2xl border p-5 backdrop-blur">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase">
                  Profile readiness
                </p>
                <p className="tabular mt-1 text-4xl font-semibold">{readiness}%</p>
              </div>
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl",
                  readiness >= 75
                    ? "bg-success/10 text-success"
                    : "bg-primary/10 text-primary"
                )}
              >
                {readiness >= 75 ? <CheckCircle2 /> : <Sparkles />}
              </div>
            </div>
            <div className="bg-muted mt-4 h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-[width] duration-700"
                style={{ width: `${readiness}%` }}
              />
            </div>
            <p className="text-muted-foreground mt-3 text-xs leading-5">
              {document
                ? "Based on the completeness of your latest parsed résumé."
                : "Parse a résumé to calculate profile readiness."}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Best ATS match",
            value: bestScore === null ? "—" : `${bestScore}%`,
            note: averageScore === null ? "No reports yet" : `${averageScore}% average`,
            icon: Target,
          },
          {
            label: "Résumés",
            value: resumes.data?.length ?? 0,
            note: `${resumes.data?.filter((resume) => resume.parsed).length ?? 0} ready for matching`,
            icon: FileText,
          },
          {
            label: "Target roles",
            value: jobs.data?.length ?? 0,
            note: "Saved opportunities",
            icon: BriefcaseBusiness,
          },
          {
            label: "Cover letters",
            value: letters.data?.length ?? 0,
            note: "Role-specific drafts",
            icon: PenLine,
          },
        ].map(({ label, value, note, icon: Icon }) => (
          <Card key={label} className="gap-3">
            <CardHeader className="flex grid-cols-none flex-row items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium uppercase">
                {label}
              </span>
              <Icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <p className="tabular text-2xl font-semibold">{value}</p>
              <p className="text-muted-foreground mt-1 text-xs">{note}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="border-b">
            <div>
              <p className="text-muted-foreground font-mono text-[10px] tracking-[0.18em] uppercase">
                Recommended
              </p>
              <CardTitle className="mt-1 text-lg">Your next best move</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-52 flex-col justify-between gap-8 pt-2">
            <div className="space-y-3">
              <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <Gauge className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{nextAction.label}</h2>
                <p className="text-muted-foreground mt-1 max-w-xl text-sm leading-6">
                  {nextAction.body}
                </p>
              </div>
            </div>
            <ButtonLink href={nextAction.href} className="w-fit">
              Continue
              <ArrowRight />
            </ButtonLink>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex grid-cols-none flex-row items-center justify-between border-b">
            <CardTitle>Recent matches</CardTitle>
            <Link
              href="/ats"
              className="text-primary text-xs font-medium hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {sortedReports?.slice(0, 3).map((report) => (
              <Link
                key={report.id}
                href={`/ats/${report.id}`}
                className="hover:bg-muted flex items-center gap-3 rounded-xl p-3 transition-colors"
              >
                <div
                  className={cn(
                    "tabular flex size-11 shrink-0 items-center justify-center rounded-full border-4 text-xs font-semibold",
                    report.match_score >= 75
                      ? "border-success/25 text-success"
                      : report.match_score >= 50
                        ? "border-warning/25 text-warning"
                        : "border-destructive/25 text-destructive"
                  )}
                >
                  {report.match_score}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {jobNames.get(report.job_id) ?? "Saved role"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {report.analysis_stage === "optimized"
                      ? "Optimized résumé"
                      : "Original résumé"}{" "}
                    · {dateFormat.format(new Date(report.created_at))}
                  </p>
                </div>
                <ArrowRight className="text-muted-foreground size-4" />
              </Link>
            ))}

            {!sortedReports?.length && (
              <div className="flex min-h-44 flex-col items-center justify-center text-center">
                <Target className="text-muted-foreground/50 size-7" />
                <p className="mt-3 text-sm font-medium">No matches yet</p>
                <p className="text-muted-foreground mt-1 max-w-52 text-xs">
                  Analyze a parsed résumé against a saved job.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
