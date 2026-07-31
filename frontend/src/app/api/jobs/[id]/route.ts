import { proxyToBackend } from "@/shared/api/server"

type Context = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params
  return proxyToBackend(`/api/v1/jobs/${encodeURIComponent(id)}`)
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params
  return proxyToBackend(`/api/v1/jobs/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}
