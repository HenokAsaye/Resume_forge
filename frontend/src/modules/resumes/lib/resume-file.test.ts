import { describe, expect, it } from "vitest"
import {
  formatBytes,
  MAX_FILE_SIZE_BYTES,
  nameFromFile,
  validateResumeFile,
} from "./resume-file"

const PDF = "application/pdf"
const DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

function fakeFile(name: string, type: string, size: number): File {
  const file = new File(["x"], name, { type })
  Object.defineProperty(file, "size", { value: size })
  return file
}

describe("validateResumeFile", () => {
  it("accepts a PDF and a DOCX whose type matches the extension", () => {
    expect(validateResumeFile(fakeFile("cv.pdf", PDF, 1024))).toBeNull()
    expect(validateResumeFile(fakeFile("cv.docx", DOCX, 1024))).toBeNull()
  })

  it("rejects extensions the backend does not accept", () => {
    expect(validateResumeFile(fakeFile("cv.txt", "text/plain", 10))).toBe(
      "Only PDF and DOCX files are supported"
    )
    expect(validateResumeFile(fakeFile("cv", "", 10))).toBe(
      "Only PDF and DOCX files are supported"
    )
  })

  it("rejects a file whose declared type contradicts its extension", () => {
    expect(validateResumeFile(fakeFile("cv.pdf", DOCX, 1024))).toBe(
      "This file's type does not match its extension"
    )
  })

  it("tolerates a charset parameter and uppercase extensions", () => {
    expect(
      validateResumeFile(fakeFile("CV.PDF", "application/pdf; charset=binary", 1024))
    ).toBeNull()
  })

  it("accepts a browser that reports no type at all", () => {
    expect(validateResumeFile(fakeFile("cv.pdf", "", 1024))).toBeNull()
  })

  it("rejects an empty file", () => {
    expect(validateResumeFile(fakeFile("cv.pdf", PDF, 0))).toBe("This file is empty")
  })

  it("rejects a file over the backend's limit but allows one exactly at it", () => {
    expect(validateResumeFile(fakeFile("cv.pdf", PDF, MAX_FILE_SIZE_BYTES))).toBeNull()
    expect(
      validateResumeFile(fakeFile("cv.pdf", PDF, MAX_FILE_SIZE_BYTES + 1))
    ).toBe("File must be smaller than 6.0 MB")
  })
})

describe("nameFromFile", () => {
  it("strips the extension and separators", () => {
    expect(nameFromFile("senior_backend-engineer.pdf")).toBe(
      "senior backend engineer"
    )
  })

  it("caps the name at the backend's 100 character limit", () => {
    expect(nameFromFile(`${"a".repeat(150)}.pdf`)).toHaveLength(100)
  })
})

describe("formatBytes", () => {
  it("scales units", () => {
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(2048)).toBe("2 KB")
    expect(formatBytes(6 * 1024 * 1024)).toBe("6.0 MB")
  })
})
