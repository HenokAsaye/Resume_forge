import { proxyToBackend } from "@/shared/api/server"

export async function GET() {
  return proxyToBackend("/api/v1/jobs")
}

export async function POST(request: Request) {
  return proxyToBackend("/api/v1/jobs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  })
}
