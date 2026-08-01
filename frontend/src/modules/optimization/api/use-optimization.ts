"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/shared/api/client"
import type {
  ExportFormat,
  OptimizationResult,
  OptimizeRequest,
  ResumeVersion,
  VersionSummary,
} from "../schemas/version.schema"

export const versionKeys = {
  all: ["versions"] as const,
  list: (resumeId: string) => [...versionKeys.all, resumeId] as const,
  detail: (resumeId: string, versionId: string) =>
    [...versionKeys.all, resumeId, versionId] as const,
}

export function useResumeVersions(resumeId: string) {
  return useQuery({
    queryKey: versionKeys.list(resumeId),
    queryFn: () => api.get<VersionSummary[]>(`/api/resumes/${resumeId}/versions`),
    enabled: Boolean(resumeId),
  })
}

export function useResumeVersion(resumeId: string, versionId: string) {
  return useQuery({
    queryKey: versionKeys.detail(resumeId, versionId),
    queryFn: () =>
      api.get<ResumeVersion>(`/api/resumes/${resumeId}/versions/${versionId}`),
    enabled: Boolean(resumeId && versionId),
  })
}

export function useOptimizeResume(resumeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: OptimizeRequest) =>
      api.post<OptimizationResult>(
        `/api/resumes/${resumeId}/optimize`,
        body,
        { ai: true }
      ),
    onSuccess: (result) => {
      queryClient.setQueryData(
        versionKeys.detail(resumeId, result.version.id),
        result.version
      )
      queryClient.invalidateQueries({ queryKey: versionKeys.list(resumeId) })
      queryClient.invalidateQueries({ queryKey: ["ats"] })
    },
  })
}

export function exportUrl(
  resumeId: string,
  format: ExportFormat,
  versionNumber?: number
): string {
  const search = new URLSearchParams({ format })
  if (versionNumber !== undefined) {
    search.set("version", String(versionNumber))
  }
  return `/api/resumes/${resumeId}/export?${search}`
}
