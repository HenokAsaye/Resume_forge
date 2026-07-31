import type { Metadata } from "next"
import { LettersWorkbench } from "./letters-workbench"

export const metadata: Metadata = {
  title: "Cover letters",
}

export default function CoverLettersPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <div className="space-y-1.5">
        <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          Cover letters
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Drafts from your own material
        </h1>
        <p className="text-muted-foreground text-sm">
          Generated from a parsed résumé and job, then yours to edit. Nothing is
          sent anywhere.
        </p>
      </div>

      <LettersWorkbench />
    </div>
  )
}
