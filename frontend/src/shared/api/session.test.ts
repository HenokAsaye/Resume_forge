import { beforeEach, describe, expect, it, vi } from "vitest"

const store = new Map<string, string>()
const setCalls: { name: string; maxAge: number }[] = []

vi.mock("server-only", () => ({}))

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      store.has(name) ? { name, value: store.get(name) } : undefined,
    set: (name: string, value: string, options?: { maxAge?: number }) => {
      store.set(name, value)
      setCalls.push({ name, maxAge: options?.maxAge ?? 0 })
    },
    delete: (name: string) => store.delete(name),
  }),
}))

vi.mock("@/shared/lib/env", () => ({ env: { API_URL: "http://backend" } }))

type Session = {
  access_token: string
  refresh_token: string
  expires_in: number
  user_id: string
  email: string
}

function rotated(n: number): Session {
  return {
    access_token: `access-${n}`,
    refresh_token: `refresh-${n}`,
    expires_in: 3600,
    user_id: "u-1",
    email: "abel@example.com",
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

async function loadSession() {
  vi.resetModules()
  return import("./session")
}

beforeEach(() => {
  store.clear()
  setCalls.length = 0
  store.set("resumeai_at", "access-1")
  store.set("resumeai_rt", "refresh-1")
})

describe("refreshAccessToken", () => {
  it("rotates once when several requests race with the same token", async () => {
    const { refreshAccessToken } = await loadSession()
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(rotated(2)))
    vi.stubGlobal("fetch", fetchMock)

    const tokens = await Promise.all([
      refreshAccessToken(),
      refreshAccessToken(),
      refreshAccessToken(),
      refreshAccessToken(),
      refreshAccessToken(),
    ])

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(new Set(tokens)).toEqual(new Set(["access-2"]))
    expect(store.get("resumeai_rt")).toBe("refresh-2")
  })

  it("serves a straggler holding an already-rotated token instead of expiring it", async () => {
    const { refreshAccessToken } = await loadSession()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(rotated(2))))

    await refreshAccessToken()

    store.set("resumeai_rt", "refresh-1")
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ detail: "Invalid" }, 401))
    )

    await expect(refreshAccessToken()).resolves.toBe("access-2")
  })

  it("expires the session when the refresh token is genuinely rejected", async () => {
    const { refreshAccessToken, SessionExpiredError } = await loadSession()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ detail: "Invalid" }, 401))
    )

    await expect(refreshAccessToken()).rejects.toBeInstanceOf(SessionExpiredError)
  })

  it("does not expire the session when the auth service is briefly unavailable", async () => {
    const { refreshAccessToken, RefreshUnavailableError } = await loadSession()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ detail: "upstream" }, 503))
    )

    await expect(refreshAccessToken()).rejects.toBeInstanceOf(
      RefreshUnavailableError
    )
    expect(store.get("resumeai_rt")).toBe("refresh-1")
  })

  it("does not expire the session when the network drops", async () => {
    const { refreshAccessToken, RefreshUnavailableError } = await loadSession()
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")))

    await expect(refreshAccessToken()).rejects.toBeInstanceOf(
      RefreshUnavailableError
    )
    expect(store.get("resumeai_rt")).toBe("refresh-1")
  })

  it("retries with the current cookie when another request rotated mid-flight", async () => {
    const { refreshAccessToken } = await loadSession()

    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const sent = JSON.parse(String(init.body)).refresh_token

      if (sent === "refresh-1") {
        store.set("resumeai_rt", "refresh-9")
        return jsonResponse({ detail: "Already used" }, 401)
      }

      return jsonResponse(rotated(10))
    })
    vi.stubGlobal("fetch", fetchMock)

    await expect(refreshAccessToken()).resolves.toBe("access-10")
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("expires the session when there is no refresh token at all", async () => {
    const { refreshAccessToken, SessionExpiredError } = await loadSession()
    store.delete("resumeai_rt")

    await expect(refreshAccessToken()).rejects.toBeInstanceOf(SessionExpiredError)
  })
})

describe("session cookies", () => {
  it("keeps the refresh cookie well past the access token's hour", async () => {
    const { persistSession } = await loadSession()

    await persistSession({
      access_token: "a",
      refresh_token: "r",
      expires_in: 3600,
      user_id: "u",
      email: "e@example.com",
    })

    const access = setCalls.find((call) => call.name === "resumeai_at")
    const refresh = setCalls.find((call) => call.name === "resumeai_rt")

    expect(access?.maxAge).toBe(3570)
    expect(refresh?.maxAge).toBeGreaterThanOrEqual(3 * 24 * 60 * 60)
  })
})
