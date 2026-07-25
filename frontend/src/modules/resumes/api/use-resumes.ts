"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/shared/api/client"
import type {
  Resume,
  ResumeListItem,
  ResumeUploadResponse,
} from "../schemas/resume.schema"

const resumeKeys = {
  all: ["resumes"] as const,
  detail: (id: string) => ["resumes", id] as const,
}

export function useResumes() {
  return useQuery({
    queryKey: resumeKeys.all,
    queryFn: () => api.get<ResumeListItem[]>("/api/v1/resumes"),
  })
}

export function useResume(id: string) {
  return useQuery({
    queryKey: resumeKeys.detail(id),
    queryFn: () => api.get<Resume>(`/api/v1/resumes/${id}`),
    enabled: Boolean(id),
  })
}

export function useUploadResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.upload<ResumeUploadResponse>("/api/v1/resumes", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resumeKeys.all })
    },
  })
}

export function useParseResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<Resume>(`/api/v1/resumes/${id}/parse`),
    onSuccess: (resume) => {
      queryClient.invalidateQueries({ queryKey: resumeKeys.detail(resume.id) })
    },
  })
}
