import { z } from "zod"

export const coverLetterSchema = z.object({
  id: z.string(),
  resume_id: z.string(),
  job_id: z.string(),
  resume_version_id: z.string().nullable(),
  content: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type CoverLetter = z.infer<typeof coverLetterSchema>

export const createCoverLetterRequestSchema = z.object({
  resume_id: z.string().min(1, "Choose a résumé"),
  job_id: z.string().min(1, "Choose a job"),
})
export type CreateCoverLetterRequest = z.infer<
  typeof createCoverLetterRequestSchema
>

export const updateCoverLetterRequestSchema = z.object({
  content: z.string().trim().min(1, "A cover letter cannot be empty"),
})
export type UpdateCoverLetterRequest = z.infer<
  typeof updateCoverLetterRequestSchema
>
