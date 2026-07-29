import type { FieldValues, Path, UseFormSetError } from "react-hook-form"
import { ApiError } from "@/shared/api/client"

export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[]
): string | null {
  if (!(error instanceof ApiError)) {
    return "Something went wrong. Try again."
  }

  if (error.fieldErrors) {
    let matched = false

    for (const [path, message] of Object.entries(error.fieldErrors)) {
      if ((fields as readonly string[]).includes(path)) {
        setError(path as Path<T>, { type: "server", message })
        matched = true
      }
    }

    if (matched) {
      return null
    }
  }

  return error.detail
}
