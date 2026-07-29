import { z } from "zod"

export const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().nullable().optional(),
  created_at: z.string(),
})
export type User = z.infer<typeof userSchema>

export const registerRequestSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
})
export type RegisterRequest = z.infer<typeof registerRequestSchema>

export const loginRequestSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required").max(128),
})
export type LoginRequest = z.infer<typeof loginRequestSchema>

export const refreshRequestSchema = z.object({
  refresh_token: z.string().min(1),
})
export type RefreshRequest = z.infer<typeof refreshRequestSchema>

export const authResponseSchema = z.object({
  access_token: z.string().nullable(),
  refresh_token: z.string().nullable(),
  expires_in: z.number().int().nullable(),
  token_type: z.string().default("bearer"),
  user_id: z.string(),
  email: z.email(),
  name: z.string().nullable().optional(),
  requires_email_confirmation: z.boolean().default(false),
})
export type AuthResponse = z.infer<typeof authResponseSchema>

export const sessionSchema = z.object({
  user_id: z.string(),
  email: z.email(),
  name: z.string().nullable().optional(),
})
export type Session = z.infer<typeof sessionSchema>
