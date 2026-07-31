import { proxyFileToBackend } from "@/shared/api/server"

type Context = { params: Promise<{ id: string }> }

const FORMATS = new Set(["pdf", "docx"])

export async function GET(request: Request, { params }: Context) {
  const { id } = await params
  const incoming = new URL(request.url).searchParams

  const format = incoming.get("format") ?? "pdf"
  if (!FORMATS.has(format)) {
    return Response.json(
      { detail: "Export format must be pdf or docx" },
      { status: 422 }
    )
  }

  const search = new URLSearchParams({ format })
  const version = incoming.get("version")
  if (version) {
    search.set("version", version)
  }

  return proxyFileToBackend(
    `/api/v1/resumes/${encodeURIComponent(id)}/export?${search}`
  )
}
