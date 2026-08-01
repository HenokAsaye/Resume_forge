"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, type UploadOptions } from "@/shared/api/client"
import type {
  Resume,
  ResumeDocument,
  ResumeListItem,
  ResumeUploadResponse,
} from "../schemas/resume.schema"

export const resumeKeys = {
  all: ["resumes"] as const,
  list: () => [...resumeKeys.all, "list"] as const,
  detail: (id: string) => [...resumeKeys.all, "detail", id] as const,
  parsed: (id: string) => [...resumeKeys.all, "parsed", id] as const,
}

export function useResumes() {
  return useQuery({
    queryKey: resumeKeys.list(),
    queryFn: () => api.get<ResumeListItem[]>("/api/resumes"),
  })
}

export function useResume(id: string) {
  return useQuery({
    queryKey: resumeKeys.detail(id),
    queryFn: () => api.get<Resume>(`/api/resumes/${id}`),
    enabled: Boolean(id),
  })
}

export function useParsedResume(id: string, enabled = true) {
  return useQuery({
    queryKey: resumeKeys.parsed(id),
    queryFn: () => api.get<ResumeDocument>(`/api/resumes/${id}/parsed`),
    enabled: Boolean(id) && enabled,
  })
}

export type UploadResumeInput = {
  file: File
  name: string
  onProgress?: UploadOptions["onProgress"]
}

export function useUploadResume() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, name, onProgress }: UploadResumeInput) => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("name", name)

      return api.upload<ResumeUploadResponse>("/api/resumes", formData, {
        onProgress,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resumeKeys.list() })
    },
  })
}

export function useParseResume() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.post<Resume>(`/api/resumes/${id}/parse`, undefined, { ai: true }),
    onSuccess: (resume) => {
      queryClient.setQueryData(resumeKeys.detail(resume.id), resume)
      queryClient.invalidateQueries({ queryKey: resumeKeys.parsed(resume.id) })
      queryClient.invalidateQueries({ queryKey: resumeKeys.list() })
    },
  })
}

export function useDeleteResume() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.remove<void>(`/api/resumes/${id}`),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: resumeKeys.detail(id) })
      queryClient.removeQueries({ queryKey: resumeKeys.parsed(id) })
      queryClient.invalidateQueries({ queryKey: resumeKeys.list() })
    },
  })
}

export function resumeDownloadUrl(id: string): string {
  return `/api/resumes/${id}/download`
}
