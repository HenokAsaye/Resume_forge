import { Suspense } from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { LoginForm } from "@/modules/auth"
import { Skeleton } from "@/shared/ui/skeleton"

export const metadata: Metadata = {
  title: "Sign in",
}

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          Sign in
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      </div>

      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <LoginForm />
      </Suspense>

      <p className="text-muted-foreground text-sm">
        No account?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
