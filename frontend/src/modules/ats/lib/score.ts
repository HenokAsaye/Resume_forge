export type ScoreBand = "low" | "mid" | "high"

export function scoreBand(score: number): ScoreBand {
  if (score >= 75) {
    return "high"
  }
  if (score >= 50) {
    return "mid"
  }
  return "low"
}

const BAND_TEXT: Record<ScoreBand, string> = {
  low: "text-score-low",
  mid: "text-score-mid",
  high: "text-score-high",
}

const BAND_BACKGROUND: Record<ScoreBand, string> = {
  low: "bg-score-low",
  mid: "bg-score-mid",
  high: "bg-score-high",
}

const BAND_LABEL: Record<ScoreBand, string> = {
  low: "Weak match",
  mid: "Partial match",
  high: "Strong match",
}

export function scoreTextClass(score: number): string {
  return BAND_TEXT[scoreBand(score)]
}

export function scoreBackgroundClass(score: number): string {
  return BAND_BACKGROUND[scoreBand(score)]
}

export function scoreLabel(score: number): string {
  return BAND_LABEL[scoreBand(score)]
}

export function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}
