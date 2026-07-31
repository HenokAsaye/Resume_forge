import { proxyFileToBackend } from "@/shared/api/server"

type Context = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params
  return proxyFileToBackend(`/api/v1/resumes/${encodeURIComponent(id)}/download`)
}
