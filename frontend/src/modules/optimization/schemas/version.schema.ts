import { z } from "zod"

export const resumeVersionSchema = z.object({
  id: z.string(),
  resume_id: z.string(),
  version_number: z.number(),
  optimized_json: z.record(z.string(), z.unknown()).optional(),
  diff_json: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string(),
})
export type ResumeVersion = z.infer<typeof resumeVersionSchema>

export const diffSectionSchema = z.object({
  section: z.string(),
  op: z.enum(["added", "removed", "modified"]),
  before: z.string().optional(),
  after: z.string().optional(),
  value: z.string().optional(),
})
export type DiffSection = z.infer<typeof diffSectionSchema>

export const diffSchema = z.object({
  sections: z.array(diffSectionSchema),
})
export type Diff = z.infer<typeof diffSchema>

export const optimizeRequestSchema = z.object({
  job_id: z.string(),
})
export type OptimizeRequest = z.infer<typeof optimizeRequestSchema>
