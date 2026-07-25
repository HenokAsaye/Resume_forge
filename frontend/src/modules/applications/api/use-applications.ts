"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/shared/api/client"
import type {
  ApplicationStatus,
  CreateApplicationRequest,
  JobApplication,
  UpdateApplicationRequest,
} from "../schemas/application.schema"

const applicationKeys = {
  all: ["applications"] as const,
  detail: (id: string) => ["applications", id] as const,
}

export function useApplications(status?: ApplicationStatus) {
  const query = status ? `?status=${status}` : ""
  return useQuery({
    queryKey: [...applicationKeys.all, status ?? "all"],
    queryFn: () => api.get<JobApplication[]>(`/api/v1/applications${query}`),
  })
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => api.get<JobApplication>(`/api/v1/applications/${id}`),
    enabled: Boolean(id),
  })
}

export function useCreateApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateApplicationRequest) =>
      api.post<JobApplication>("/api/v1/applications", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all })
    },
  })
}

export function useUpdateApplication(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateApplicationRequest) =>
      api.patch<JobApplication>(`/api/v1/applications/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all })
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id) })
    },
  })
}

export function useDeleteApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.remove<void>(`/api/v1/applications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all })
    },
  })
}
