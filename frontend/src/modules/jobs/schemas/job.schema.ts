import { z } from "zod"

export const jobDescriptionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  company: z.string().optional(),
  raw_text: z.string().optional(),
  parsed_json: z.record(z.string(), z.unknown()).optional(),
  url: z.string().optional(),
  created_at: z.string(),
})
export type JobDescription = z.infer<typeof jobDescriptionSchema>

export const createJobRequestSchema = z.object({
  title: z.string().min(1),
  company: z.string().optional(),
  raw_text: z.string().optional(),
  url: z.string().optional(),
})
export type CreateJobRequest = z.infer<typeof createJobRequestSchema>
