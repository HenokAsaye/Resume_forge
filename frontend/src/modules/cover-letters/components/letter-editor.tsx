"use client"

import { useState } from "react"
import { Check, Copy, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ApiError } from "@/shared/api/client"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Textarea } from "@/shared/ui/textarea"
import { useUpdateCoverLetter } from "../api/use-cover-letters"
import { updateCoverLetterRequestSchema } from "../schemas/cover-letter.schema"
import type { CoverLetter } from "../schemas/cover-letter.schema"

function downloadText(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function LetterEditor({
  letter,
  filename = "cover-letter.txt",
}: {
  letter: CoverLetter
  filename?: string
}) {
  const update = useUpdateCoverLetter(letter.id)
  const [content, setContent] = useState(letter.content)
  const [saved, setSaved] = useState(letter.content)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const dirty = content !== saved
  const words = content.trim() ? content.trim().split(/\s+/).length : 0

  async function onSave() {
    const parsed = updateCoverLetterRequestSchema.safeParse({ content })

    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setError(null)

    try {
      const result = await update.mutateAsync(parsed.data)
      setContent(result.content)
      setSaved(result.content)
      toast.success("Saved")
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.detail : "Could not save your changes"
      )
    }
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Your browser blocked clipboard access")
    }
  }

  return (
    <div className="space-y-4">
      <Textarea
        value={content}
        rows={22}
        aria-label="Cover letter"
        className="leading-relaxed"
        onChange={(event) => setContent(event.target.value)}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground font-mono text-xs">
          <span className="tabular">{words}</span> words
          {dirty && " · unsaved changes"}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={onCopy}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </Button>

          <Button
            variant="outline"
            onClick={() => downloadText(filename, content)}
          >
            <Download />
            Download
          </Button>

          <Button onClick={onSave} disabled={!dirty || update.isPending}>
            {update.isPending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
