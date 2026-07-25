import { z } from "zod"

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  created_at: z.string(),
})
export type User = z.infer<typeof userSchema>

export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
})
export type RegisterRequest = z.infer<typeof registerRequestSchema>

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
export type LoginRequest = z.infer<typeof loginRequestSchema>

export const authResponseSchema = z.object({
  access_token: z.string(),
  user_id: z.string(),
  email: z.string(),
  name: z.string().nullable().optional(),
})
export type AuthResponse = z.infer<typeof authResponseSchema>
