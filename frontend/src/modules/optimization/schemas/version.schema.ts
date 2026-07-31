import { z } from "zod"

export const changeOperationSchema = z.enum(["added", "removed", "modified"])
export type ChangeOperation = z.infer<typeof changeOperationSchema>

export const resumeChangeSchema = z.object({
  section: z.string(),
  op: changeOperationSchema,
  before: z.string(),
  after: z.string(),
  reason: z.string(),
})
export type ResumeChange = z.infer<typeof resumeChangeSchema>

export const diffSchema = z.object({
  sections: z.array(resumeChangeSchema),
})
export type Diff = z.infer<typeof diffSchema>

export const versionSummarySchema = z.object({
  id: z.string(),
  version_number: z.number().int().min(1),
  created_at: z.string(),
})
export type VersionSummary = z.infer<typeof versionSummarySchema>

export const resumeVersionSchema = versionSummarySchema.extend({
  resume_id: z.string(),
  source_job_id: z.string().nullable(),
  optimized_json: z.record(z.string(), z.unknown()),
  diff_json: z.record(z.string(), z.unknown()).nullable(),
})
export type ResumeVersion = z.infer<typeof resumeVersionSchema>

export const optimizationScoreSchema = z.object({
  id: z.string(),
  match_score: z.number(),
})
export type OptimizationScore = z.infer<typeof optimizationScoreSchema>

export const optimizationResultSchema = z.object({
  version: resumeVersionSchema,
  initial_ats: optimizationScoreSchema,
  final_ats: optimizationScoreSchema,
})
export type OptimizationResult = z.infer<typeof optimizationResultSchema>

export const optimizeRequestSchema = z.object({
  job_id: z.string().min(1, "Choose a job to optimize against"),
})
export type OptimizeRequest = z.infer<typeof optimizeRequestSchema>

export function readDiff(value: unknown): Diff | null {
  const parsed = diffSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export const exportFormats = ["pdf", "docx"] as const
export type ExportFormat = (typeof exportFormats)[number]
