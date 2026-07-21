"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function usePing() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => api.health(),
    retry: 2,
    staleTime: 30000,
  })
}
