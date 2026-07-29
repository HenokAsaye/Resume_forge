import {
  backendFetch,
  backendUnreachableResponse,
  BackendUnreachableError,
} from "@/shared/api/server"
import { persistSession, type BackendSession } from "@/shared/api/session"

export async function POST(request: Request) {
  const body = await request.text()

  try {
    const upstream = await backendFetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    })

    const payload = await upstream.json().catch(() => null)

    if (!upstream.ok) {
      return Response.json(payload ?? { detail: "Login failed" }, {
        status: upstream.status,
      })
    }

    const session = payload as BackendSession
    await persistSession(session)

    return Response.json({
      user_id: session.user_id,
      email: session.email,
      name: session.name ?? null,
    })
  } catch (error) {
    if (error instanceof BackendUnreachableError) {
      return backendUnreachableResponse()
    }
    throw error
  }
}
