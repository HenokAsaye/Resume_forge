"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, MailCheck } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field"
import { useRegister } from "../api/use-auth"
import { applyServerErrors } from "../lib/apply-server-errors"
import {
  registerRequestSchema,
  type RegisterRequest,
} from "../schemas/auth.schema"

const FIELDS = ["name", "email", "password"] as const

export function RegisterForm() {
  const router = useRouter()
  const registerUser = useRegister()
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(registerRequestSchema),
    defaultValues: { name: "", email: "", password: "" },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)

    try {
      const result = await registerUser.mutateAsync(values)

      if (result.requires_email_confirmation) {
        setPendingEmail(result.email)
        return
      }

      router.replace("/dashboard")
      router.refresh()
    } catch (error) {
      setFormError(applyServerErrors(error, setError, FIELDS))
    }
  })

  if (pendingEmail) {
    return (
      <div className="space-y-4 text-center">
        <span className="bg-accent text-accent-foreground mx-auto flex size-11 items-center justify-center rounded-full">
          <MailCheck className="size-5" />
        </span>
        <h2 className="text-lg font-medium tracking-tight">Confirm your email</h2>
        <p className="text-muted-foreground text-sm">
          We sent a confirmation link to{" "}
          <span className="text-foreground font-medium">{pendingEmail}</span>. Open
          it to activate your account, then sign in.
        </p>
        <Button variant="outline" className="w-full" onClick={() => router.push("/login")}>
          Go to sign in
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            autoComplete="name"
            autoFocus
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <FieldDescription>At least 8 characters.</FieldDescription>
          <FieldError errors={[errors.password]} />
        </Field>
      </FieldGroup>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        Create account
      </Button>
    </form>
  )
}
