import { forwardAIHeaders, proxyToBackend } from "@/shared/api/server"

type Context = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Context) {
  const { id } = await params
  return proxyToBackend(`/api/v1/jobs/${encodeURIComponent(id)}/parse`, {
    method: "POST",
    headers: forwardAIHeaders(request),
  })
}
