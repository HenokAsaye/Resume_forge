import { beforeEach, describe, expect, it } from "vitest"
import {
  clearAICredentials,
  getAICredentialsSnapshot,
  getAIRequestHeaders,
  parseAICredentials,
  saveAICredentials,
} from "./ai-credentials"

describe("AI credentials", () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it("stores a normalized personal key for this browser session", () => {
    saveAICredentials({
      provider: "gemini",
      apiKey: "  personal-key  ",
    })

    expect(parseAICredentials(getAICredentialsSnapshot())).toEqual({
      provider: "gemini",
      apiKey: "personal-key",
    })
  })

  it("builds provider headers only when a personal key exists", () => {
    expect(getAIRequestHeaders()).toEqual({})

    saveAICredentials({
      provider: "openai",
      apiKey: "sk-test",
    })

    expect(getAIRequestHeaders()).toEqual({
      "X-AI-Provider": "openai",
      "X-AI-API-Key": "sk-test",
    })
  })

  it("clears credentials and ignores malformed storage", () => {
    window.sessionStorage.setItem("resume-ai:credentials", "not-json")
    expect(getAIRequestHeaders()).toEqual({})

    saveAICredentials({ provider: "gemini", apiKey: "key" })
    clearAICredentials()

    expect(getAICredentialsSnapshot()).toBe("")
  })
})
