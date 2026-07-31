import { proxyToBackend } from "@/shared/api/server"

export async function POST(request: Request) {
  return proxyToBackend("/api/v1/ats/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  })
}
