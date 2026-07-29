import {
  backendFetch,
  backendUnreachableResponse,
  BackendUnreachableError,
  relayJson,
} from "@/shared/api/server"

export async function GET() {
  try {
    const upstream = await backendFetch("/api/v1/health")
    return relayJson(upstream)
  } catch (error) {
    if (error instanceof BackendUnreachableError) {
      return backendUnreachableResponse()
    }
    throw error
  }
}
