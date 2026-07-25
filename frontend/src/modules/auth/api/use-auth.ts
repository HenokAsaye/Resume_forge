"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { api } from "@/shared/api/client"
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "../schemas/auth.schema"

export function useLogin() {
  return useMutation({
    mutationFn: (body: LoginRequest) =>
      api.post<AuthResponse>("/api/v1/auth/login", body),
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (body: RegisterRequest) =>
      api.post<AuthResponse>("/api/v1/auth/register", body),
  })
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.get<User>("/api/v1/auth/me"),
  })
}
