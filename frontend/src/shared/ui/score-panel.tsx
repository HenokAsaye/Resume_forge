import { ArrowRight, Check, Minus } from "lucide-react"

export function ScorePanel({
  matched,
  missing,
}: {
  matched: string[]
  missing: string[]
}) {
  return (
    <figure className="border-border bg-background w-full rounded-xl border shadow-sm">
      <figcaption className="border-border flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <span className="truncate font-mono text-xs">
          senior-backend-engineer.pdf
        </span>
        <span className="text-muted-foreground shrink-0 font-mono text-[10px] tracking-widest uppercase">
          Analysis
        </span>
      </figcaption>

      <div className="border-border flex items-end justify-between gap-4 border-b px-4 py-4">
        <div>
          <p className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
            Match score
          </p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-score-low tabular text-2xl font-semibold line-through decoration-2">
              47
            </span>
            <ArrowRight aria-hidden className="text-muted-foreground size-3.5" />
            <span className="text-score-high tabular text-4xl font-semibold">
              82
            </span>
          </p>
        </div>
        <ScoreBar />
      </div>

      <div className="border-border space-y-3 border-b px-4 py-4">
        <p className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
          Keywords
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {missing.map((word) => (
            <li
              key={word}
              className="border-score-low/40 text-score-low flex items-center gap-1 rounded-md border border-dashed px-2 py-0.5 font-mono text-xs"
            >
              <Minus aria-hidden className="size-3" />
              {word}
            </li>
          ))}
          {matched.map((word) => (
            <li
              key={word}
              className="border-border text-muted-foreground flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-xs"
            >
              <Check aria-hidden className="text-score-high size-3" />
              {word}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2 px-4 py-4">
        <p className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
          Suggested rewrite · experience[0]
        </p>
        <p className="border-score-low/50 text-muted-foreground border-l-2 py-0.5 pl-3 text-sm line-through">
          Built APIs for internal tools and helped with deployments.
        </p>
        <p className="border-score-high bg-score-high/5 border-l-2 py-0.5 pl-3 text-sm">
          Built and scaled <strong className="font-medium">12 gRPC services</strong>{" "}
          serving 40k req/s, deployed on{" "}
          <strong className="font-medium">Kubernetes</strong> via{" "}
          <strong className="font-medium">Terraform</strong>.
        </p>
      </div>
    </figure>
  )
}

function ScoreBar() {
  return (
    <div aria-hidden className="flex h-12 items-end gap-1">
      {[38, 44, 41, 52, 49, 58, 61, 57, 66, 71, 78, 82].map((value, index) => (
        <span
          key={value}
          className={`w-1.5 rounded-t-[2px] ${
            index < 5
              ? "bg-score-low/35"
              : index < 9
                ? "bg-score-mid/45"
                : "bg-score-high"
          }`}
          style={{ height: `${value}%` }}
        />
      ))}
    </div>
  )
}
