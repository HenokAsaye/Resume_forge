import Link from "next/link"
import type { ReactNode } from "react"
import { ButtonLink } from "@/shared/ui/button-link"
import { ThemeToggle } from "@/shared/ui/theme-toggle"
import { BackendStatus } from "@/shared/ui/backend-status"

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border bg-background/90 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-5">
          <Link href="/" className="group flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-tight">
              Resume<span className="text-primary">AI</span>
            </span>
            <span className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
              ATS
            </span>
          </Link>

          <nav className="text-muted-foreground hidden items-center gap-7 font-mono text-xs tracking-wide uppercase md:flex">
            <a href="#analysis" className="hover:text-foreground transition-colors">
              Analysis
            </a>
            <a href="#pipeline" className="hover:text-foreground transition-colors">
              Pipeline
            </a>
            <a href="#surface" className="hover:text-foreground transition-colors">
              Surface
            </a>
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <ButtonLink variant="ghost" size="sm" href="/login">
              Sign in
            </ButtonLink>
            <ButtonLink size="sm" href="/register">
              Start
            </ButtonLink>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="border-border mx-auto w-full max-w-5xl border-x">
          {children}
        </div>
      </main>

      <footer className="border-border border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-5xl flex-col gap-3 px-5 py-6 font-mono text-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="tracking-wide">
            RESUMEAI — WRITTEN FOR THE SCANNER, READ BY THE RECRUITER
          </p>
          <BackendStatus />
        </div>
      </footer>
    </div>
  )
}
