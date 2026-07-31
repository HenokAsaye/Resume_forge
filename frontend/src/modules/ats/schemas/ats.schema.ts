import { z } from "zod"

export const analysisStageSchema = z.enum(["original", "optimized"])
export type AnalysisStage = z.infer<typeof analysisStageSchema>

export const atsReportSchema = z.object({
  id: z.string(),
  resume_id: z.string(),
  job_id: z.string(),
  resume_version_id: z.string().nullable(),
  analysis_stage: analysisStageSchema,
  match_score: z.number().min(0).max(100),
  missing_keywords: z.array(z.string()),
  suggestions: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  created_at: z.string(),
})
export type ATSReport = z.infer<typeof atsReportSchema>

export const analyzeAtsRequestSchema = z.object({
  resume_id: z.string().min(1, "Choose a résumé"),
  job_id: z.string().min(1, "Choose a job"),
})
export type AnalyzeAtsRequest = z.infer<typeof analyzeAtsRequestSchema>
