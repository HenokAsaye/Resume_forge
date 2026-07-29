import "server-only"

import { cookies } from "next/headers"
import { env } from "@/shared/lib/env"

const ACCESS_COOKIE = "resumeai_at"
const REFRESH_COOKIE = "resumeai_rt"
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30
const EXPIRY_SKEW_SECONDS = 30

export type BackendSession = {
  access_token: string | null
  refresh_token: string | null
  expires_in: number | null
  user_id: string
  email: string
  name?: string | null
  requires_email_confirmation?: boolean
}

export class SessionExpiredError extends Error {
  constructor() {
    super("Your session has expired. Sign in again.")
    this.name = "SessionExpiredError"
  }
}

const baseCookie = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const

export async function persistSession(session: BackendSession): Promise<void> {
  if (!session.access_token || !session.refresh_token) {
    return
  }

  const store = await cookies()
  const maxAge = Math.max((session.expires_in ?? 3600) - EXPIRY_SKEW_SECONDS, 60)

  store.set(ACCESS_COOKIE, session.access_token, { ...baseCookie, maxAge })
  store.set(REFRESH_COOKIE, session.refresh_token, {
    ...baseCookie,
    maxAge: REFRESH_MAX_AGE,
  })
}

export async function clearSession(): Promise<void> {
  const store = await cookies()
  store.delete(ACCESS_COOKIE)
  store.delete(REFRESH_COOKIE)
}

export async function readAccessToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(ACCESS_COOKIE)?.value ?? null
}

export async function readRefreshToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(REFRESH_COOKIE)?.value ?? null
}

export async function hasSession(): Promise<boolean> {
  return (await readRefreshToken()) !== null
}

const inFlightRefreshes = new Map<string, Promise<string>>()

async function requestRotatedSession(refreshToken: string): Promise<string> {
  const response = await fetch(`${env.API_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new SessionExpiredError()
  }

  const session = (await response.json()) as BackendSession

  if (!session.access_token) {
    throw new SessionExpiredError()
  }

  await persistSession(session)
  return session.access_token
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = await readRefreshToken()

  if (!refreshToken) {
    throw new SessionExpiredError()
  }

  const existing = inFlightRefreshes.get(refreshToken)
  if (existing) {
    return existing
  }

  const pending = requestRotatedSession(refreshToken).finally(() => {
    inFlightRefreshes.delete(refreshToken)
  })

  inFlightRefreshes.set(refreshToken, pending)
  return pending
}

export async function requireAccessToken(): Promise<string> {
  const token = await readAccessToken()
  return token ?? (await refreshAccessToken())
}
