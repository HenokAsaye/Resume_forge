import { proxyToBackend, sessionExpiredResponse } from "@/shared/api/server"
import { hasSession } from "@/shared/api/session"

export async function GET() {
  if (!(await hasSession())) {
    return sessionExpiredResponse()
  }

  return proxyToBackend("/api/v1/auth/me")
}
