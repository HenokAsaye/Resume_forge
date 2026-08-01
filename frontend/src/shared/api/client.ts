import { ApiError, apiErrorFromBody, apiErrorFromResponse } from "./errors"
import { getAIRequestHeaders } from "@/shared/lib/ai-credentials"

export type RequestOptions = {
  signal?: AbortSignal
  ai?: boolean
}

export type HealthStatus = {
  status: string
  service: string
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {}

  if (options.ai) {
    Object.assign(headers, getAIRequestHeaders())
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json"
  }

  let response: Response

  try {
    response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error
    }
    throw new ApiError(0, "Network error. Check your connection and try again.")
  }

  if (!response.ok) {
    throw await apiErrorFromResponse(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export type UploadOptions = RequestOptions & {
  onProgress?: (percent: number) => void
}

function upload<T>(
  path: string,
  formData: FormData,
  options: UploadOptions = {}
): Promise<T> {
  const { onProgress, signal } = options

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", path)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      let body: unknown = null
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null
      } catch {
        body = null
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as T)
        return
      }

      reject(apiErrorFromBody(xhr.status, body))
    }

    xhr.onerror = () =>
      reject(new ApiError(0, "Network error. Check your connection and try again."))
    xhr.onabort = () => reject(new ApiError(0, "Upload cancelled"))

    if (signal) {
      if (signal.aborted) {
        xhr.abort()
        return
      }
      signal.addEventListener("abort", () => xhr.abort(), { once: true })
    }

    xhr.send(formData)
  })
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, undefined, options),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body, options),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),

  remove: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),

  upload,

  health: (options?: RequestOptions) =>
    request<HealthStatus>("GET", "/api/health", undefined, options),
}

export { ApiError } from "./errors"
export type { FieldErrors } from "./errors"
