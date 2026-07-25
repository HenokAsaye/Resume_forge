import { z } from "zod"

export const coverLetterSchema = z.object({
  id: z.string(),
  resume_id: z.string(),
  job_id: z.string(),
  content: z.string().nullable().optional(),
  created_at: z.string(),
})
export type CoverLetter = z.infer<typeof coverLetterSchema>

export const createCoverLetterRequestSchema = z.object({
  resume_id: z.string(),
  job_id: z.string(),
})
export type CreateCoverLetterRequest = z.infer<typeof createCoverLetterRequestSchema>

export const updateCoverLetterRequestSchema = z.object({
  content: z.string(),
})
export type UpdateCoverLetterRequest = z.infer<typeof updateCoverLetterRequestSchema>
