import { proxyToBackend } from "@/shared/api/server"

type Context = { params: Promise<{ id: string; versionId: string }> }

export async function GET(_request: Request, { params }: Context) {
  const { id, versionId } = await params

  return proxyToBackend(
    `/api/v1/resumes/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}`
  )
}
