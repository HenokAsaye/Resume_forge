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

export class RefreshUnavailableError extends Error {
  constructor() {
    super("Could not renew your session. Try again in a moment.")
    this.name = "RefreshUnavailableError"
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

const ROTATION_GRACE_MS = 60 * 1000
const rotatedTokens = new Map<string, { accessToken: string; at: number }>()

function rememberRotation(usedToken: string, accessToken: string): void {
  const now = Date.now()

  for (const [token, entry] of rotatedTokens) {
    if (now - entry.at > ROTATION_GRACE_MS) {
      rotatedTokens.delete(token)
    }
  }

  rotatedTokens.set(usedToken, { accessToken, at: now })
}

function recallRotation(usedToken: string): string | null {
  const entry = rotatedTokens.get(usedToken)

  if (!entry || Date.now() - entry.at > ROTATION_GRACE_MS) {
    return null
  }

  return entry.accessToken
}

async function requestRotatedSession(refreshToken: string): Promise<string> {
  let response: Response

  try {
    response = await fetch(`${env.API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    })
  } catch {
    throw new RefreshUnavailableError()
  }

  if (!response.ok) {
    const replayed = recallRotation(refreshToken)
    if (replayed) {
      return replayed
    }

    const current = await readRefreshToken()
    if (current && current !== refreshToken) {
      return requestRotatedSession(current)
    }

    if (response.status === 400 || response.status === 401) {
      throw new SessionExpiredError()
    }

    throw new RefreshUnavailableError()
  }

  const session = (await response.json()) as BackendSession

  if (!session.access_token) {
    throw new SessionExpiredError()
  }

  await persistSession(session)
  rememberRotation(refreshToken, session.access_token)

  return session.access_token
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = await readRefreshToken()

  if (!refreshToken) {
    throw new SessionExpiredError()
  }

  const replayed = recallRotation(refreshToken)
  if (replayed) {
    return replayed
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
