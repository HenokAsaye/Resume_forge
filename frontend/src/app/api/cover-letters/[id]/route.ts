import { proxyToBackend } from "@/shared/api/server"

type Context = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params
  return proxyToBackend(`/api/v1/cover-letters/${encodeURIComponent(id)}`)
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params

  return proxyToBackend(`/api/v1/cover-letters/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  })
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params

  return proxyToBackend(`/api/v1/cover-letters/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}
