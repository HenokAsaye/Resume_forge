import { z } from "zod"

export const jobDocumentSchema = z.object({
  title: z.string(),
  company: z.string(),
  seniority: z.string(),
  responsibilities: z.array(z.string()),
  required_skills: z.array(z.string()),
  preferred_skills: z.array(z.string()),
  qualifications: z.array(z.string()),
  keywords: z.array(z.string()),
})
export type JobDocument = z.infer<typeof jobDocumentSchema>

export const jobSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  url: z.string().nullable(),
  created_at: z.string(),
})
export type JobSummary = z.infer<typeof jobSummarySchema>

export const jobDetailSchema = jobSummarySchema.extend({
  raw_text: z.string(),
  parsed_json: jobDocumentSchema.nullable(),
})
export type JobDetail = z.infer<typeof jobDetailSchema>

export const jobParseResultSchema = z.object({
  id: z.string(),
  parsed_json: jobDocumentSchema,
})
export type JobParseResult = z.infer<typeof jobParseResultSchema>

export const createJobRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give this job a title")
    .max(200, "Title must be at most 200 characters"),
  company: z.string().trim().max(200, "Company must be at most 200 characters"),
  raw_text: z.string().trim().min(1, "Paste the job description before saving"),
  url: z.union([
    z.url({ protocol: /^https?$/, error: "Enter a valid http(s) link" }),
    z.literal(""),
  ]),
})
export type CreateJobRequest = z.infer<typeof createJobRequestSchema>
