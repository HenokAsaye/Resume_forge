"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/shared/api/client"
import type { AnalyzeAtsRequest, ATSReport } from "../schemas/ats.schema"

export type ReportFilters = {
  resumeId?: string
  jobId?: string
}

export const atsKeys = {
  all: ["ats"] as const,
  reports: (filters: ReportFilters = {}) =>
    [...atsKeys.all, "reports", filters.resumeId ?? null, filters.jobId ?? null] as const,
  report: (id: string) => [...atsKeys.all, "report", id] as const,
}

function reportsPath(filters: ReportFilters): string {
  const search = new URLSearchParams()
  if (filters.resumeId) {
    search.set("resume_id", filters.resumeId)
  }
  if (filters.jobId) {
    search.set("job_id", filters.jobId)
  }
  const query = search.toString()
  return `/api/ats/reports${query ? `?${query}` : ""}`
}

export function useAtsReports(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: atsKeys.reports(filters),
    queryFn: () => api.get<ATSReport[]>(reportsPath(filters)),
  })
}

export function useAtsReport(id: string) {
  return useQuery({
    queryKey: atsKeys.report(id),
    queryFn: () => api.get<ATSReport>(`/api/ats/reports/${id}`),
    enabled: Boolean(id),
  })
}

export function useAnalyzeAts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: AnalyzeAtsRequest) =>
      api.post<ATSReport>("/api/ats/analyze", body, { ai: true }),
    onSuccess: (report) => {
      queryClient.setQueryData(atsKeys.report(report.id), report)
      queryClient.invalidateQueries({ queryKey: atsKeys.all })
    },
  })
}
