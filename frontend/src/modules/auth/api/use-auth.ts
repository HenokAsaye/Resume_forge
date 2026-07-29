"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, ApiError } from "@/shared/api/client"
import type {
  LoginRequest,
  RegisterRequest,
  RegisterResult,
  Session,
  User,
} from "../schemas/auth.schema"

export const authKeys = {
  me: ["auth", "me"] as const,
}

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => api.get<User>("/api/auth/me"),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: LoginRequest) => api.post<Session>("/api/auth/login", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: RegisterRequest) =>
      api.post<RegisterResult>("/api/auth/register", body),
    onSuccess: (result) => {
      if (!result.requires_email_confirmation) {
        queryClient.invalidateQueries({ queryKey: authKeys.me })
      }
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post<void>("/api/auth/logout"),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.isUnauthorized
}
