"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/shared/api/client"
import type {
  CoverLetter,
  CreateCoverLetterRequest,
  UpdateCoverLetterRequest,
} from "../schemas/cover-letter.schema"

const coverLetterKeys = {
  all: ["cover-letters"] as const,
  detail: (id: string) => ["cover-letters", id] as const,
}

export function useCoverLetters(params?: { resumeId?: string; jobId?: string }) {
  const search = new URLSearchParams()
  if (params?.resumeId) search.set("resume_id", params.resumeId)
  if (params?.jobId) search.set("job_id", params.jobId)
  const query = search.toString()
  return useQuery({
    queryKey: [...coverLetterKeys.all, params ?? {}],
    queryFn: () =>
      api.get<CoverLetter[]>(
        `/api/v1/cover-letters${query ? `?${query}` : ""}`
      ),
  })
}

export function useCreateCoverLetter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCoverLetterRequest) =>
      api.post<CoverLetter>("/api/v1/cover-letters", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coverLetterKeys.all })
    },
  })
}

export function useUpdateCoverLetter(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateCoverLetterRequest) =>
      api.patch<CoverLetter>(`/api/v1/cover-letters/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coverLetterKeys.detail(id) })
    },
  })
}

export function useDeleteCoverLetter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.remove<void>(`/api/v1/cover-letters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coverLetterKeys.all })
    },
  })
}
