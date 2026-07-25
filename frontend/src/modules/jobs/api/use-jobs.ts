"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/shared/api/client"
import type { CreateJobRequest, JobDescription } from "../schemas/job.schema"

const jobKeys = {
  all: ["jobs"] as const,
  detail: (id: string) => ["jobs", id] as const,
}

export function useJobs() {
  return useQuery({
    queryKey: jobKeys.all,
    queryFn: () => api.get<JobDescription[]>("/api/v1/jobs"),
  })
}

export function useJob(id: string) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => api.get<JobDescription>(`/api/v1/jobs/${id}`),
    enabled: Boolean(id),
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateJobRequest) =>
      api.post<JobDescription>("/api/v1/jobs", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all })
    },
  })
}

export function useParseJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post<JobDescription>(`/api/v1/jobs/${id}/parse`),
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(job.id) })
    },
  })
}
