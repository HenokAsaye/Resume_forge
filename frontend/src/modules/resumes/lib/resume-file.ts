export const MAX_FILE_SIZE_BYTES = 6 * 1024 * 1024

const MIME_BY_EXTENSION: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

export const ACCEPTED_EXTENSIONS = Object.keys(MIME_BY_EXTENSION)
export const ACCEPT_ATTRIBUTE = [
  ...ACCEPTED_EXTENSIONS,
  ...Object.values(MIME_BY_EXTENSION),
].join(",")

function extensionOf(filename: string): string {
  const index = filename.lastIndexOf(".")
  return index === -1 ? "" : filename.slice(index).toLowerCase()
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function describeFile(file: File): string {
  return `${extensionOf(file.name).replace(".", "").toUpperCase()} · ${formatBytes(file.size)}`
}

export function nameFromFile(filename: string): string {
  const base = filename.slice(0, filename.lastIndexOf(".") || undefined)
  return base.replace(/[_-]+/g, " ").trim().slice(0, 100)
}

export function validateResumeFile(file: File): string | null {
  const extension = extensionOf(file.name)
  const expectedMimeType = MIME_BY_EXTENSION[extension]

  if (!expectedMimeType) {
    return "Only PDF and DOCX files are supported"
  }

  if (file.type && file.type.split(";")[0].trim().toLowerCase() !== expectedMimeType) {
    return "This file's type does not match its extension"
  }

  if (file.size === 0) {
    return "This file is empty"
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File must be smaller than ${formatBytes(MAX_FILE_SIZE_BYTES)}`
  }

  return null
}
