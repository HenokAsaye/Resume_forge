"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileText,
  Gauge,
  LayoutDashboard,
  Briefcase,
  PenLine,
  Menu,
} from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/shared/ui/sheet"
import { ThemeToggle } from "@/shared/ui/theme-toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  ready: boolean
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, ready: true },
  { href: "/resumes", label: "Résumés", icon: FileText, ready: true },
  { href: "/jobs", label: "Jobs", icon: Briefcase, ready: true },
  { href: "/ats", label: "ATS reports", icon: Gauge, ready: true },
  { href: "/cover-letters", label: "Cover letters", icon: PenLine, ready: false },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon, ready }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)

        if (!ready) {
          return (
            <Tooltip key={href}>
              <TooltipTrigger
                render={
                  <span
                    aria-disabled
                    className="text-muted-foreground/50 flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm"
                  >
                    <Icon className="size-4" />
                    {label}
                  </span>
                }
              />
              <TooltipContent side="right">Coming soon</TooltipContent>
            </Tooltip>
          )
        }

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-secondary text-secondary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AppShell({
  children,
  userMenu,
}: {
  children: ReactNode
  userMenu: ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <aside className="border-border bg-card/30 hidden w-60 shrink-0 flex-col border-r lg:flex">
        <div className="border-border flex h-14 items-center border-b px-5">
          <Link href="/dashboard" className="flex items-baseline gap-2">
            <span className="font-semibold tracking-tight">
              Resume<span className="text-primary">AI</span>
            </span>
          </Link>
        </div>
        <div className="flex-1 p-3">
          <NavLinks />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    aria-label="Open navigation"
                  >
                    <Menu />
                  </Button>
                }
              />
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="border-border flex h-14 items-center border-b px-5 text-base">
                  Resume<span className="text-primary">AI</span>
                </SheetTitle>
                <div className="p-3">
                  <NavLinks onNavigate={() => setMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex-1" />

            <ThemeToggle />
            {userMenu}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  )
}
