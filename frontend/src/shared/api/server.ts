import "server-only"

import { env } from "@/shared/lib/env"
import {
  clearSession,
  refreshAccessToken,
  requireAccessToken,
  SessionExpiredError,
} from "./session"

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

export function sessionExpiredResponse(): Response {
  return Response.json(
    { detail: "Your session has expired. Sign in again." },
    { status: 401 }
  )
}

export async function authedBackendFetch(
  path: string,
  init: Omit<BackendRequestInit, "accessToken"> = {}
): Promise<Response> {
  const response = await backendFetch(path, {
    ...init,
    accessToken: await requireAccessToken(),
  })

  if (response.status !== 401) {
    return response
  }

  return backendFetch(path, {
    ...init,
    accessToken: await refreshAccessToken(),
  })
}

async function toErrorResponse(error: unknown): Promise<Response> {
  if (error instanceof SessionExpiredError) {
    await clearSession()
    return sessionExpiredResponse()
  }
  if (error instanceof BackendUnreachableError) {
    return backendUnreachableResponse()
  }
  throw error
}

export async function proxyToBackend(
  path: string,
  init: Omit<BackendRequestInit, "accessToken"> = {}
): Promise<Response> {
  try {
    return await relayJson(await authedBackendFetch(path, init))
  } catch (error) {
    return toErrorResponse(error)
  }
}

const FILE_HEADERS = ["content-type", "content-disposition", "content-length"]

export async function proxyFileToBackend(
  path: string,
  init: Omit<BackendRequestInit, "accessToken"> = {}
): Promise<Response> {
  try {
    const upstream = await authedBackendFetch(path, init)

    if (!upstream.ok) {
      return relayJson(upstream)
    }

    const headers = new Headers()
    for (const name of FILE_HEADERS) {
      const value = upstream.headers.get(name)
      if (value) {
        headers.set(name, value)
      }
    }

    return new Response(upstream.body, { status: upstream.status, headers })
  } catch (error) {
    return toErrorResponse(error)
  }
}
