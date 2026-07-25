import { z } from "zod"

export const atsReportSchema = z.object({
  id: z.string(),
  resume_id: z.string(),
  job_id: z.string(),
  match_score: z.number(),
  missing_keywords: z.array(z.string()).optional(),
  suggestions: z.array(z.string()).optional(),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  created_at: z.string(),
})
export type ATSReport = z.infer<typeof atsReportSchema>

export const analyzeAtsRequestSchema = z.object({
  resume_id: z.string(),
  job_id: z.string(),
})
export type AnalyzeAtsRequest = z.infer<typeof analyzeAtsRequestSchema>
