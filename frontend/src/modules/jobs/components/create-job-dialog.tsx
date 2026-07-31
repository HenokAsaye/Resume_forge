"use client"

import { useState, type ReactElement } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { ApiError } from "@/shared/api/client"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { useCreateJob } from "../api/use-jobs"
import {
  createJobRequestSchema,
  type CreateJobRequest,
} from "../schemas/job.schema"

export function CreateJobDialog({ trigger }: { trigger?: ReactElement }) {
  const router = useRouter()
  const create = useCreateJob()
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateJobRequest>({
    resolver: zodResolver(createJobRequestSchema),
    defaultValues: { title: "", company: "", raw_text: "", url: "" },
  })

  function onOpenChange(next: boolean) {
    if (isSubmitting) {
      return
    }
    setOpen(next)
    if (!next) {
      reset()
      setFormError(null)
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)

    try {
      const job = await create.mutateAsync(values)
      onOpenChange(false)
      toast.success(`Saved ${job.title}`)
      router.push(`/jobs/${job.id}`)
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.detail
          : "Could not save this job. Try again."
      )
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={trigger ?? <Button>
          <Plus />
          Add job
        </Button>}
      />

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a job description</DialogTitle>
          <DialogDescription>
            Paste the posting text. Parsing pulls out the requirements and
            keywords a résumé gets scored against.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="job-title">Title</FieldLabel>
                <Input
                  id="job-title"
                  autoFocus
                  placeholder="Senior Frontend Engineer"
                  aria-invalid={Boolean(errors.title)}
                  {...register("title")}
                />
                <FieldError errors={[errors.title]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="job-company">Company</FieldLabel>
                <Input
                  id="job-company"
                  placeholder="Optional"
                  aria-invalid={Boolean(errors.company)}
                  {...register("company")}
                />
                <FieldError errors={[errors.company]} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="job-url">Link</FieldLabel>
              <Input
                id="job-url"
                type="url"
                inputMode="url"
                placeholder="https://example.com/careers/123"
                aria-invalid={Boolean(errors.url)}
                {...register("url")}
              />
              <FieldError errors={[errors.url]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="job-text">Description</FieldLabel>
              <Textarea
                id="job-text"
                rows={9}
                placeholder="Paste the full posting here"
                aria-invalid={Boolean(errors.raw_text)}
                {...register("raw_text")}
              />
              <FieldError errors={[errors.raw_text]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Save job
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
