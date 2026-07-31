import { describe, expect, it } from "vitest"
import { readDiff, resumeVersionSchema } from "./version.schema"

describe("readDiff", () => {
  it("reads the shape the backend actually stores", () => {
    const diff = readDiff({
      sections: [
        {
          section: "experience",
          op: "modified",
          before: "Did things",
          after: "Shipped the BFF layer",
          reason: "Quantifies impact",
        },
      ],
    })

    expect(diff?.sections).toHaveLength(1)
    expect(diff?.sections[0].op).toBe("modified")
  })

  it("returns null rather than throwing when a version has no diff", () => {
    expect(readDiff(null)).toBeNull()
    expect(readDiff(undefined)).toBeNull()
  })

  it("returns null for an unrecognised operation instead of rendering it", () => {
    expect(
      readDiff({
        sections: [
          { section: "skills", op: "reordered", before: "", after: "", reason: "" },
        ],
      })
    ).toBeNull()
  })

  it("returns null when the payload is not a diff at all", () => {
    expect(readDiff({ changes: [] })).toBeNull()
    expect(readDiff("nope")).toBeNull()
  })
})

describe("resumeVersionSchema", () => {
  it("accepts a version with no source job and no diff", () => {
    const result = resumeVersionSchema.safeParse({
      id: "v1",
      version_number: 1,
      created_at: "2026-07-31T00:00:00Z",
      resume_id: "r1",
      source_job_id: null,
      optimized_json: {},
      diff_json: null,
    })

    expect(result.success).toBe(true)
  })

  it("rejects a version number below one", () => {
    const result = resumeVersionSchema.safeParse({
      id: "v1",
      version_number: 0,
      created_at: "2026-07-31T00:00:00Z",
      resume_id: "r1",
      source_job_id: null,
      optimized_json: {},
      diff_json: null,
    })

    expect(result.success).toBe(false)
  })
})
