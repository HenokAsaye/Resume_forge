import { proxyToBackend } from "@/shared/api/server"

const FORWARDED_PARAMS = ["resume_id", "job_id"]

export async function GET(request: Request) {
  const incoming = new URL(request.url).searchParams
  const forwarded = new URLSearchParams()

  for (const name of FORWARDED_PARAMS) {
    const value = incoming.get(name)
    if (value) {
      forwarded.set(name, value)
    }
  }

  const query = forwarded.toString()

  return proxyToBackend(`/api/v1/ats/reports${query ? `?${query}` : ""}`)
}
