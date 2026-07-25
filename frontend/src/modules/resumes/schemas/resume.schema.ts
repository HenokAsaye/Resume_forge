import { z } from "zod"

export const resumeSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  original_file_url: z.string().optional(),
  parsed_json: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string(),
})
export type Resume = z.infer<typeof resumeSchema>

export const resumeListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
  parsed: z.boolean(),
})
export type ResumeListItem = z.infer<typeof resumeListItemSchema>

export const resumeUploadResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  file_url: z.string().nullable().optional(),
})
export type ResumeUploadResponse = z.infer<typeof resumeUploadResponseSchema>
