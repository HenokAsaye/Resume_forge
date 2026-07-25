const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { supabase } = await import("@/shared/lib/supabase")
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`
  }
  return headers
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }
  return response.json()
}

export const api = {
  async get<T>(path: string): Promise<T> {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE}${path}`, { headers })
    return handleResponse<T>(response)
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    return handleResponse<T>(response)
  },

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE}${path}`, {
      method: "PATCH",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    return handleResponse<T>(response)
  },

  async remove<T>(path: string): Promise<T> {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE}${path}`, {
      method: "DELETE",
      headers,
    })
    if (response.status === 204) {
      return undefined as T
    }
    return handleResponse<T>(response)
  },

  async upload<T>(path: string, formData: FormData): Promise<T> {
    const headers = await getAuthHeaders()
    delete headers["Content-Type"]
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers,
      body: formData,
    })
    return handleResponse<T>(response)
  },

  async health(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${API_BASE}/api/v1/health`)
    return handleResponse(response)
  },
}
