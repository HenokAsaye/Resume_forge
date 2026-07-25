import { z } from "zod"

export const analyticsSummarySchema = z.object({
  resumes: z.number(),
  jobs: z.number(),
  applications_by_status: z.record(z.string(), z.number()),
  avg_match_score: z.number(),
})
export type AnalyticsSummary = z.infer<typeof analyticsSummarySchema>

export const scoreTrendPointSchema = z.object({
  date: z.string(),
  match_score: z.number(),
})
export type ScoreTrendPoint = z.infer<typeof scoreTrendPointSchema>

export const scoreTrendSchema = z.object({
  points: z.array(scoreTrendPointSchema),
})
export type ScoreTrend = z.infer<typeof scoreTrendSchema>

export const funnelSchema = z.record(z.string(), z.number())
export type Funnel = z.infer<typeof funnelSchema>
