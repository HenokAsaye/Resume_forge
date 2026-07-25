"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/shared/api/client"
import type { AnalyticsSummary, Funnel, ScoreTrend } from "../schemas/analytics.schema"

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: () => api.get<AnalyticsSummary>("/api/v1/analytics/summary"),
  })
}

export function useScoreTrend(resumeId?: string) {
  const query = resumeId ? `?resume_id=${resumeId}` : ""
  return useQuery({
    queryKey: ["analytics", "score-trend", resumeId ?? "all"],
    queryFn: () => api.get<ScoreTrend>(`/api/v1/analytics/score-trend${query}`),
  })
}

export function useFunnel() {
  return useQuery({
    queryKey: ["analytics", "funnel"],
    queryFn: () => api.get<Funnel>("/api/v1/analytics/funnel"),
  })
}
