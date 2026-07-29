import "server-only"

import { env } from "@/shared/lib/env"

export type BackendRequestInit = Omit<RequestInit, "body"> & {
  body?: BodyInit | null
  accessToken?: string | null
}

export class BackendUnreachableError extends Error {
  constructor() {
    super("Could not reach the backend service")
    this.name = "BackendUnreachableError"
  }
}

export async function backendFetch(
  path: string,
  init: BackendRequestInit = {}
): Promise<Response> {
  const { accessToken, headers, ...rest } = init
  const requestHeaders = new Headers(headers)

  if (accessToken) {
    requestHeaders.set("authorization", `Bearer ${accessToken}`)
  }

  try {
    return await fetch(`${env.API_URL}${path}`, {
      ...rest,
      headers: requestHeaders,
      cache: "no-store",
    })
  } catch {
    throw new BackendUnreachableError()
  }
}

export async function relayJson(upstream: Response): Promise<Response> {
  if (upstream.status === 204) {
    return new Response(null, { status: 204 })
  }

  const text = await upstream.text()

  if (!text) {
    return new Response(null, { status: upstream.status })
  }

  return new Response(text, {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  })
}

export function backendUnreachableResponse(): Response {
  return Response.json(
    { detail: "Could not reach the backend service" },
    { status: 502 }
  )
}
