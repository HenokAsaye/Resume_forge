import Link from "next/link"
import type { ReactNode } from "react"
import { ThemeToggle } from "@/shared/ui/theme-toggle"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border border-b">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-tight">
              Resume<span className="text-primary">AI</span>
            </span>
            <span className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
              ATS
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  )
}
