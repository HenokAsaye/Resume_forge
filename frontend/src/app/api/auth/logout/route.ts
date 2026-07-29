import { clearSession } from "@/shared/api/session"

export async function POST() {
  await clearSession()
  return new Response(null, { status: 204 })
}
