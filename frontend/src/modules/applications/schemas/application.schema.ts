import { z } from "zod"

export const applicationStatusSchema = z.enum([
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
])
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>

export const jobApplicationSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  job_id: z.string(),
  resume_version_id: z.string().optional(),
  status: applicationStatusSchema,
  notes: z.string().optional(),
  applied_at: z.string().optional(),
  created_at: z.string(),
})
export type JobApplication = z.infer<typeof jobApplicationSchema>

export const createApplicationRequestSchema = z.object({
  job_id: z.string(),
  resume_version_id: z.string().optional(),
  status: applicationStatusSchema.optional(),
  notes: z.string().optional(),
})
export type CreateApplicationRequest = z.infer<typeof createApplicationRequestSchema>

export const updateApplicationRequestSchema = z.object({
  status: applicationStatusSchema.optional(),
  notes: z.string().optional(),
  applied_at: z.string().optional(),
})
export type UpdateApplicationRequest = z.infer<typeof updateApplicationRequestSchema>
