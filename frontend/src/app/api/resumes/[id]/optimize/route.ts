import { proxyToBackend } from "@/shared/api/server"

type Context = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Context) {
  const { id } = await params

  return proxyToBackend(`/api/v1/resumes/${encodeURIComponent(id)}/optimize`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await request.text(),
  })
}
