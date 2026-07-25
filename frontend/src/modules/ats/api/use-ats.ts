"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/shared/api/client"
import type { AnalyzeAtsRequest, ATSReport } from "../schemas/ats.schema"

const atsKeys = {
  reports: ["ats", "reports"] as const,
}

export function useAnalyzeAts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AnalyzeAtsRequest) =>
      api.post<ATSReport>("/api/v1/ats/analyze", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: atsKeys.reports })
    },
  })
}

export function useAtsReports(params?: { resumeId?: string; jobId?: string }) {
  const search = new URLSearchParams()
  if (params?.resumeId) search.set("resume_id", params.resumeId)
  if (params?.jobId) search.set("job_id", params.jobId)
  const query = search.toString()
  return useQuery({
    queryKey: [...atsKeys.reports, params ?? {}],
    queryFn: () =>
      api.get<ATSReport[]>(`/api/v1/ats/reports${query ? `?${query}` : ""}`),
  })
}
