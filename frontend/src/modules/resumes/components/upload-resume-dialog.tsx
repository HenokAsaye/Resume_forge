"use client"

import {
  useId,
  useRef,
  useState,
  type DragEvent,
  type ReactElement,
  type SubmitEvent,
} from "react"
import { useRouter } from "next/navigation"
import { FileText, Loader2, Upload, X } from "lucide-react"
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
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Progress, ProgressLabel, ProgressValue } from "@/shared/ui/progress"
import { cn } from "@/shared/lib/utils"
import { useUploadResume } from "../api/use-resumes"
import {
  ACCEPT_ATTRIBUTE,
  describeFile,
  formatBytes,
  MAX_FILE_SIZE_BYTES,
  nameFromFile,
  validateResumeFile,
} from "../lib/resume-file"
import { resumeUploadRequestSchema } from "../schemas/resume.schema"

export function UploadResumeDialog({ trigger }: { trigger?: ReactElement }) {
  const router = useRouter()
  const upload = useUploadResume()
  const inputRef = useRef<HTMLInputElement>(null)
  const nameFieldId = useId()

  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState("")
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const busy = upload.isPending

  function reset() {
    setFile(null)
    setName("")
    setError(null)
    setProgress(0)
    setDragging(false)
  }

  function onOpenChange(next: boolean) {
    if (busy) {
      return
    }
    setOpen(next)
    if (!next) {
      reset()
    }
  }

  function acceptFile(candidate: File | undefined) {
    if (!candidate) {
      return
    }

    const problem = validateResumeFile(candidate)
    if (problem) {
      setFile(null)
      setError(problem)
      return
    }

    setError(null)
    setFile(candidate)
    if (!name.trim()) {
      setName(nameFromFile(candidate.name))
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    if (!busy) {
      acceptFile(event.dataTransfer.files[0])
    }
  }

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!file) {
      setError("Choose a PDF or DOCX file first")
      return
    }

    const parsedName = resumeUploadRequestSchema.safeParse({ name })
    if (!parsedName.success) {
      setError(parsedName.error.issues[0].message)
      return
    }

    setError(null)
    setProgress(0)

    try {
      const resume = await upload.mutateAsync({
        file,
        name: parsedName.data.name,
        onProgress: setProgress,
      })
      setOpen(false)
      reset()
      toast.success(`Uploaded ${resume.name}`)
      router.push(`/resumes/${resume.id}`)
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.detail
          : "Upload failed. Try again in a moment."
      )
      setProgress(0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={trigger ?? <Button>
          <Upload />
          Upload résumé
        </Button>}
      />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload a résumé</DialogTitle>
          <DialogDescription>
            PDF or DOCX, up to {formatBytes(MAX_FILE_SIZE_BYTES)}. Parsing happens
            after the file is stored.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div
            onDragOver={(event) => {
              event.preventDefault()
              if (!busy) setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "border-border rounded-lg border border-dashed transition-colors",
              dragging && "border-primary bg-primary/5",
              busy && "opacity-60"
            )}
          >
            <input
              ref={inputRef}
              type="file"
              aria-label="Résumé file"
              accept={ACCEPT_ATTRIBUTE}
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                acceptFile(event.target.files?.[0])
                event.target.value = ""
              }}
            />

            {file ? (
              <div className="flex items-center gap-3 p-3">
                <FileText className="text-muted-foreground size-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-muted-foreground font-mono text-xs">
                    {describeFile(file)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove file"
                  disabled={busy}
                  onClick={() => setFile(null)}
                >
                  <X />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className="hover:bg-muted/50 flex w-full flex-col items-center gap-1.5 rounded-lg px-4 py-8 text-center transition-colors"
              >
                <Upload className="text-muted-foreground size-5" />
                <span className="text-sm font-medium">
                  Drop a file or click to browse
                </span>
                <span className="text-muted-foreground font-mono text-xs tracking-wide uppercase">
                  PDF · DOCX
                </span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={nameFieldId}>Name</Label>
            <Input
              id={nameFieldId}
              value={name}
              disabled={busy}
              maxLength={100}
              placeholder="Backend Engineer CV"
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          {busy && (
            <Progress value={progress}>
              <ProgressLabel>Uploading</ProgressLabel>
              <ProgressValue />
            </Progress>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !file}>
              {busy && <Loader2 className="animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
