import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { UserMenu } from "@/modules/auth"
import { hasSession } from "@/shared/api/session"
import { AppShell } from "@/shared/ui/app-shell"

export default async function AppLayout({ children }: { children: ReactNode }) {
  if (!(await hasSession())) {
    redirect("/login")
  }

  return <AppShell userMenu={<UserMenu />}>{children}</AppShell>
}
