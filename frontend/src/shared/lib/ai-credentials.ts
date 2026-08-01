export type AIProvider = "gemini" | "openai"

export type AICredentials = {
  provider: AIProvider
  apiKey: string
}

const STORAGE_KEY = "resume-ai:credentials"
const CHANGE_EVENT = "resume-ai:credentials-changed"

export function getAICredentialsSnapshot(): string {
  if (typeof window === "undefined") {
    return ""
  }
  return window.sessionStorage.getItem(STORAGE_KEY) ?? ""
}

export function parseAICredentials(snapshot: string): AICredentials | null {
  if (!snapshot) {
    return null
  }

  try {
    const value = JSON.parse(snapshot) as Partial<AICredentials>
    if (
      (value.provider === "gemini" || value.provider === "openai") &&
      typeof value.apiKey === "string" &&
      value.apiKey.trim()
    ) {
      return {
        provider: value.provider,
        apiKey: value.apiKey.trim(),
      }
    }
  } catch {
    return null
  }

  return null
}

export function saveAICredentials(credentials: AICredentials): void {
  const normalized = {
    provider: credentials.provider,
    apiKey: credentials.apiKey.trim(),
  }

  if (!normalized.apiKey) {
    clearAICredentials()
    return
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function clearAICredentials(): void {
  window.sessionStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeToAICredentials(onStoreChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onStoreChange)
  window.addEventListener("storage", onStoreChange)

  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange)
    window.removeEventListener("storage", onStoreChange)
  }
}

export function getAIRequestHeaders(): Record<string, string> {
  const credentials = parseAICredentials(getAICredentialsSnapshot())
  if (!credentials) {
    return {}
  }

  return {
    "X-AI-Provider": credentials.provider,
    "X-AI-API-Key": credentials.apiKey,
  }
}
