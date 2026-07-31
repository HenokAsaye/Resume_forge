import type { Metadata } from "next"
import { AtsWorkbench } from "./ats-workbench"

export const metadata: Metadata = {
  title: "ATS reports",
}

export default function AtsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <div className="space-y-1.5">
        <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          ATS
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Score a résumé against a job
        </h1>
        <p className="text-muted-foreground text-sm">
          Both sides need parsing first. The report shows the keywords behind the
          number, not just the number.
        </p>
      </div>

      <AtsWorkbench />
    </div>
  )
}
