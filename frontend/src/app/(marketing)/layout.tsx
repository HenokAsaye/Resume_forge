import Link from "next/link"
import type { ReactNode } from "react"
import { FileText } from "lucide-react"
import { ButtonLink } from "@/shared/ui/button-link"
import { ThemeToggle } from "@/shared/ui/theme-toggle"
import { BackendStatus } from "@/shared/ui/backend-status"

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border/80 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg">
              <FileText className="size-4" />
            </span>
            ResumeAI
          </Link>

          <nav className="text-muted-foreground hidden items-center gap-6 text-sm md:flex">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-foreground transition-colors"
            >
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <ButtonLink variant="ghost" size="sm" href="/login">
              Sign in
            </ButtonLink>
            <ButtonLink size="sm" href="/register">
              Get started
            </ButtonLink>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-border/80 border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm sm:flex-row sm:px-6">
          <p>ResumeAI — built for job seekers who want the interview.</p>
          <BackendStatus />
        </div>
      </footer>
    </div>
  )
}
