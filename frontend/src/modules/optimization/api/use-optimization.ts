"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/shared/api/client"
import type { Diff, OptimizeRequest, ResumeVersion } from "../schemas/version.schema"

const versionKeys = {
  list: (resumeId: string) => ["resumes", resumeId, "versions"] as const,
  detail: (resumeId: string, versionId: string) =>
    ["resumes", resumeId, "versions", versionId] as const,
}

export function useOptimizeResume(resumeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: OptimizeRequest) =>
      api.post<ResumeVersion>(`/api/v1/resumes/${resumeId}/optimize`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: versionKeys.list(resumeId) })
    },
  })
}

export function useResumeVersions(resumeId: string) {
  return useQuery({
    queryKey: versionKeys.list(resumeId),
    queryFn: () =>
      api.get<ResumeVersion[]>(`/api/v1/resumes/${resumeId}/versions`),
    enabled: Boolean(resumeId),
  })
}

export function useResumeVersion(resumeId: string, versionId: string) {
  return useQuery({
    queryKey: versionKeys.detail(resumeId, versionId),
    queryFn: () =>
      api.get<ResumeVersion>(
        `/api/v1/resumes/${resumeId}/versions/${versionId}`
      ),
    enabled: Boolean(resumeId && versionId),
  })
}

export function useVersionDiff(resumeId: string, versionId: string) {
  return useQuery({
    queryKey: [...versionKeys.detail(resumeId, versionId), "diff"],
    queryFn: () =>
      api.get<Diff>(
        `/api/v1/resumes/${resumeId}/versions/${versionId}/diff`
      ),
    enabled: Boolean(resumeId && versionId),
  })
}
