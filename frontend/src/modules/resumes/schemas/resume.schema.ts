import { z } from "zod"

export const resumeSchema = z.object({
  id: z.string(),
  name: z.string(),
  original_file_url: z.string(),
  parsed_json: z.record(z.string(), z.unknown()).nullable(),
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
  file_url: z.string(),
})
export type ResumeUploadResponse = z.infer<typeof resumeUploadResponseSchema>

export const contactInformationSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  links: z.array(z.string()),
})
export type ContactInformation = z.infer<typeof contactInformationSchema>

export const workExperienceSchema = z.object({
  title: z.string(),
  company: z.string(),
  start: z.string(),
  end: z.string(),
  bullets: z.array(z.string()),
})
export type WorkExperience = z.infer<typeof workExperienceSchema>

export const educationSchema = z.object({
  degree: z.string(),
  institution: z.string(),
  start: z.string(),
  end: z.string(),
})
export type Education = z.infer<typeof educationSchema>

export const projectSchema = z.object({
  name: z.string(),
  description: z.string(),
  tech: z.array(z.string()),
})
export type Project = z.infer<typeof projectSchema>

export const resumeDocumentSchema = z.object({
  contact: contactInformationSchema,
  summary: z.string(),
  skills: z.array(z.string()),
  experience: z.array(workExperienceSchema),
  education: z.array(educationSchema),
  projects: z.array(projectSchema),
  certifications: z.array(z.string()),
})
export type ResumeDocument = z.infer<typeof resumeDocumentSchema>

export const resumeUploadRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give this résumé a name")
    .max(100, "Name must be at most 100 characters"),
})
export type ResumeUploadRequest = z.infer<typeof resumeUploadRequestSchema>
