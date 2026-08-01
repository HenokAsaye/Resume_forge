"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/shared/api/client"
import type {
  CreateJobRequest,
  JobDetail,
  JobParseResult,
  JobSummary,
} from "../schemas/job.schema"

export const jobKeys = {
  all: ["jobs"] as const,
  list: () => [...jobKeys.all, "list"] as const,
  detail: (id: string) => [...jobKeys.all, "detail", id] as const,
}

export function useJobs() {
  return useQuery({
    queryKey: jobKeys.list(),
    queryFn: () => api.get<JobSummary[]>("/api/jobs"),
  })
}

export function useJob(id: string) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => api.get<JobDetail>(`/api/jobs/${id}`),
    enabled: Boolean(id),
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateJobRequest) =>
      api.post<JobSummary>("/api/jobs", {
        title: payload.title,
        company: payload.company,
        raw_text: payload.raw_text,
        url: payload.url === "" ? null : payload.url,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.list() })
    },
  })
}

export function useParseJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.post<JobParseResult>(`/api/jobs/${id}/parse`, undefined, { ai: true }),
    onSuccess: (result) => {
      queryClient.setQueryData<JobDetail>(jobKeys.detail(result.id), (previous) =>
        previous ? { ...previous, parsed_json: result.parsed_json } : previous
      )
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(result.id) })
    },
  })
}

export function useDeleteJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.remove<void>(`/api/jobs/${id}`),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: jobKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: jobKeys.list() })
    },
  })
}
