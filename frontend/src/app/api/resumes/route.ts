import { proxyToBackend } from "@/shared/api/server"

export async function GET() {
  return proxyToBackend("/api/v1/resumes")
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type")

  if (!contentType?.startsWith("multipart/form-data")) {
    return Response.json(
      { detail: "Upload must be sent as multipart/form-data" },
      { status: 415 }
    )
  }

  const body = await request.arrayBuffer()

  return proxyToBackend("/api/v1/resumes", {
    method: "POST",
    headers: { "content-type": contentType },
    body,
  })
}
