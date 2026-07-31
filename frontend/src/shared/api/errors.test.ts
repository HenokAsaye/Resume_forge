import { describe, expect, it } from "vitest"
import { ApiError, apiErrorFromBody } from "./errors"

describe("apiErrorFromBody", () => {
  it("reads the string detail emitted by the backend's own handlers", () => {
    const error = apiErrorFromBody(409, { detail: "Resume must be parsed" })

    expect(error).toBeInstanceOf(ApiError)
    expect(error.detail).toBe("Resume must be parsed")
    expect(error.fieldErrors).toBeUndefined()
    expect(error.isConflict).toBe(true)
  })

  it("turns FastAPI validation issues into a per-field map", () => {
    const error = apiErrorFromBody(422, {
      detail: [
        {
          loc: ["body", "raw_text"],
          msg: "String should have at least 1 character",
          type: "string_too_short",
        },
        {
          loc: ["body", "url"],
          msg: "Input should be a valid URL",
          type: "url_parsing",
        },
      ],
    })

    expect(error.fieldErrors).toEqual({
      raw_text: "String should have at least 1 character",
      url: "Input should be a valid URL",
    })
    expect(error.isValidation).toBe(true)
  })

  it("drops the leading body/query segment so paths match form field names", () => {
    const error = apiErrorFromBody(422, {
      detail: [{ loc: ["query", "version"], msg: "not an integer", type: "int" }],
    })

    expect(error.fieldErrors).toEqual({ version: "not an integer" })
  })

  it("keeps the first message when a field reports more than one issue", () => {
    const error = apiErrorFromBody(422, {
      detail: [
        { loc: ["body", "email"], msg: "first", type: "a" },
        { loc: ["body", "email"], msg: "second", type: "b" },
      ],
    })

    expect(error.fieldErrors?.email).toBe("first")
  })

  it("falls back to the status when the body carries no usable detail", () => {
    expect(apiErrorFromBody(500, null).detail).toBe("Request failed with status 500")
    expect(apiErrorFromBody(500, { detail: "" }).detail).toBe(
      "Request failed with status 500"
    )
  })

  it("classifies statuses the UI branches on", () => {
    expect(apiErrorFromBody(401, null).isUnauthorized).toBe(true)
    expect(apiErrorFromBody(404, null).isNotFound).toBe(true)
    expect(apiErrorFromBody(404, null).isClientError).toBe(true)
    expect(apiErrorFromBody(502, null).isClientError).toBe(false)
    expect(new ApiError(0, "offline").isNetworkError).toBe(true)
  })
})
