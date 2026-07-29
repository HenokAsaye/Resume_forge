import Link from "next/link"
import type { Metadata } from "next"
import { RegisterForm } from "@/modules/auth"

export const metadata: Metadata = {
  title: "Create account",
}

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          Register
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
      </div>

      <RegisterForm />

      <p className="text-muted-foreground text-sm">
        Already registered?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
