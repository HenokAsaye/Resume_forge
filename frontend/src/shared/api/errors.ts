export type FieldErrors = Record<string, string>

export class ApiError extends Error {
  readonly status: number
  readonly detail: string
  readonly fieldErrors?: FieldErrors

  constructor(status: number, detail: string, fieldErrors?: FieldErrors) {
    super(detail)
    this.name = "ApiError"
    this.status = status
    this.detail = detail
    this.fieldErrors = fieldErrors
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  get isForbidden(): boolean {
    return this.status === 403
  }

  get isNotFound(): boolean {
    return this.status === 404
  }

  get isConflict(): boolean {
    return this.status === 409
  }

  get isValidation(): boolean {
    return this.status === 422
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500
  }

  get isNetworkError(): boolean {
    return this.status === 0
  }
}

type ValidationIssue = {
  loc: (string | number)[]
  msg: string
  type: string
}

function isValidationIssues(value: unknown): value is ValidationIssue[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (issue) =>
        typeof issue === "object" &&
        issue !== null &&
        "loc" in issue &&
        "msg" in issue &&
        Array.isArray((issue as ValidationIssue).loc)
    )
  )
}

function toFieldErrors(issues: ValidationIssue[]): FieldErrors {
  const fieldErrors: FieldErrors = {}

  for (const issue of issues) {
    const path = issue.loc.slice(1).join(".") || "root"
    if (!(path in fieldErrors)) {
      fieldErrors[path] = issue.msg
    }
  }

  return fieldErrors
}

export function apiErrorFromBody(status: number, body: unknown): ApiError {
  const detail = (body as { detail?: unknown } | null)?.detail

  if (isValidationIssues(detail)) {
    const fieldErrors = toFieldErrors(detail)
    const first = Object.values(fieldErrors)[0] ?? "Validation failed"
    return new ApiError(status, first, fieldErrors)
  }

  if (typeof detail === "string" && detail.length > 0) {
    return new ApiError(status, detail)
  }

  return new ApiError(status, `Request failed with status ${status}`)
}

export async function apiErrorFromResponse(response: Response): Promise<ApiError> {
  let body: unknown = null

  try {
    body = await response.json()
  } catch {
    return new ApiError(
      response.status,
      response.statusText || `Request failed with status ${response.status}`
    )
  }

  return apiErrorFromBody(response.status, body)
}
