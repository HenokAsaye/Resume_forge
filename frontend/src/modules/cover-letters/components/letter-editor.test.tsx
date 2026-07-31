import { describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import { renderWithQuery, screen, waitFor } from "@/test/render"
import { LetterEditor } from "./letter-editor"
import type { CoverLetter } from "../schemas/cover-letter.schema"

const patch = vi.hoisted(() => vi.fn())

vi.mock("@/shared/api/client", async () => {
  const actual = await vi.importActual<typeof import("@/shared/api/client")>(
    "@/shared/api/client"
  )

  return { ...actual, api: { ...actual.api, patch } }
})

const letter: CoverLetter = {
  id: "cl-1",
  resume_id: "r-1",
  job_id: "j-1",
  resume_version_id: null,
  content: "Dear hiring manager, I am writing to apply.",
  created_at: "2026-07-31T00:00:00Z",
  updated_at: "2026-07-31T00:00:00Z",
}

describe("LetterEditor", () => {
  it("counts words in the current draft", () => {
    renderWithQuery(<LetterEditor letter={letter} />)

    expect(screen.getByText(/words/)).toHaveTextContent("8 words")
  })

  it("cannot be saved until something changes", async () => {
    const user = userEvent.setup()
    renderWithQuery(<LetterEditor letter={letter} />)

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()

    await user.type(screen.getByRole("textbox", { name: "Cover letter" }), " Truly.")

    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled()
    expect(screen.getByText(/unsaved changes/)).toBeInTheDocument()
  })

  it("sends only the edited content on save", async () => {
    patch.mockResolvedValueOnce({ ...letter, content: "Rewritten." })
    const user = userEvent.setup()
    renderWithQuery(<LetterEditor letter={letter} />)

    const textbox = screen.getByRole("textbox", { name: "Cover letter" })
    await user.clear(textbox)
    await user.type(textbox, "Rewritten.")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(patch).toHaveBeenCalledOnce())
    expect(patch).toHaveBeenCalledWith("/api/cover-letters/cl-1", {
      content: "Rewritten.",
    })
  })

  it("refuses to save an emptied letter and never calls the API", async () => {
    const user = userEvent.setup()
    renderWithQuery(<LetterEditor letter={letter} />)

    await user.clear(screen.getByRole("textbox", { name: "Cover letter" }))
    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(
      await screen.findByText("A cover letter cannot be empty")
    ).toBeInTheDocument()
    expect(patch).not.toHaveBeenCalled()
  })

  it("marks the draft clean again after a successful save", async () => {
    patch.mockResolvedValueOnce({ ...letter, content: "Rewritten." })
    const user = userEvent.setup()
    renderWithQuery(<LetterEditor letter={letter} />)

    const textbox = screen.getByRole("textbox", { name: "Cover letter" })
    await user.clear(textbox)
    await user.type(textbox, "Rewritten.")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(screen.queryByText(/unsaved changes/)).not.toBeInTheDocument()
    )
  })
})
