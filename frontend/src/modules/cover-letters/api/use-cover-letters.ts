"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/shared/api/client"
import type {
  CoverLetter,
  CreateCoverLetterRequest,
  UpdateCoverLetterRequest,
} from "../schemas/cover-letter.schema"

export type CoverLetterFilters = {
  resumeId?: string
  jobId?: string
}

export const coverLetterKeys = {
  all: ["cover-letters"] as const,
  list: (filters: CoverLetterFilters = {}) =>
    [...coverLetterKeys.all, "list", filters.resumeId ?? null, filters.jobId ?? null] as const,
  detail: (id: string) => [...coverLetterKeys.all, "detail", id] as const,
}

function listPath(filters: CoverLetterFilters): string {
  const search = new URLSearchParams()
  if (filters.resumeId) {
    search.set("resume_id", filters.resumeId)
  }
  if (filters.jobId) {
    search.set("job_id", filters.jobId)
  }
  const query = search.toString()
  return `/api/cover-letters${query ? `?${query}` : ""}`
}

export function useCoverLetters(filters: CoverLetterFilters = {}) {
  return useQuery({
    queryKey: coverLetterKeys.list(filters),
    queryFn: () => api.get<CoverLetter[]>(listPath(filters)),
  })
}

export function useCoverLetter(id: string) {
  return useQuery({
    queryKey: coverLetterKeys.detail(id),
    queryFn: () => api.get<CoverLetter>(`/api/cover-letters/${id}`),
    enabled: Boolean(id),
  })
}

export function useCreateCoverLetter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateCoverLetterRequest) =>
      api.post<CoverLetter>("/api/cover-letters", body),
    onSuccess: (letter) => {
      queryClient.setQueryData(coverLetterKeys.detail(letter.id), letter)
      queryClient.invalidateQueries({ queryKey: coverLetterKeys.all })
    },
  })
}

export function useUpdateCoverLetter(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: UpdateCoverLetterRequest) =>
      api.patch<CoverLetter>(`/api/cover-letters/${id}`, body),
    onSuccess: (letter) => {
      queryClient.setQueryData(coverLetterKeys.detail(letter.id), letter)
      queryClient.invalidateQueries({ queryKey: coverLetterKeys.all })
    },
  })
}

export function useDeleteCoverLetter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.remove<void>(`/api/cover-letters/${id}`),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: coverLetterKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: coverLetterKeys.all })
    },
  })
}
