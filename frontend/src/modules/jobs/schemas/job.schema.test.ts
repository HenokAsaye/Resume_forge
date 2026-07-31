import { describe, expect, it } from "vitest"
import { createJobRequestSchema, jobDetailSchema } from "./job.schema"

const valid = {
  title: "Senior Frontend Engineer",
  company: "Acme",
  raw_text: "We need a frontend engineer.",
  url: "https://example.com/careers/1",
}

describe("createJobRequestSchema", () => {
  it("accepts a complete posting", () => {
    expect(createJobRequestSchema.safeParse(valid).success).toBe(true)
  })

  it("treats an empty link as absent rather than invalid", () => {
    expect(createJobRequestSchema.safeParse({ ...valid, url: "" }).success).toBe(
      true
    )
  })

  it("rejects a link that is not http or https", () => {
    const result = createJobRequestSchema.safeParse({
      ...valid,
      url: "javascript:alert(1)",
    })

    expect(result.success).toBe(false)
  })

  it("rejects a posting with no description", () => {
    const result = createJobRequestSchema.safeParse({ ...valid, raw_text: "   " })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe(
      "Paste the job description before saving"
    )
  })

  it("enforces the backend's length ceilings", () => {
    expect(
      createJobRequestSchema.safeParse({ ...valid, title: "a".repeat(201) }).success
    ).toBe(false)
    expect(
      createJobRequestSchema.safeParse({ ...valid, company: "a".repeat(201) })
        .success
    ).toBe(false)
  })
})

describe("jobDetailSchema", () => {
  it("accepts an unparsed job", () => {
    const result = jobDetailSchema.safeParse({
      id: "1",
      title: "Engineer",
      company: "",
      url: null,
      created_at: "2026-07-31T00:00:00Z",
      raw_text: "text",
      parsed_json: null,
    })

    expect(result.success).toBe(true)
  })

  it("rejects a parsed document missing its keyword list", () => {
    const result = jobDetailSchema.safeParse({
      id: "1",
      title: "Engineer",
      company: "",
      url: null,
      created_at: "2026-07-31T00:00:00Z",
      raw_text: "text",
      parsed_json: {
        title: "Engineer",
        company: "Acme",
        seniority: "senior",
        responsibilities: [],
        required_skills: [],
        preferred_skills: [],
        qualifications: [],
      },
    })

    expect(result.success).toBe(false)
  })
})
