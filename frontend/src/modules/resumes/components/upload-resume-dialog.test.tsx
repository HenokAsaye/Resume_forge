import { describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import { fireEvent, renderWithQuery, screen, waitFor } from "@/test/render"
import { UploadResumeDialog } from "./upload-resume-dialog"

const upload = vi.hoisted(() => vi.fn())

vi.mock("@/shared/api/client", async () => {
  const actual = await vi.importActual<typeof import("@/shared/api/client")>(
    "@/shared/api/client"
  )

  return { ...actual, api: { ...actual.api, upload } }
})

function pdf(name = "senior-engineer.pdf", size = 2048): File {
  const file = new File(["%PDF-1.7"], name, { type: "application/pdf" })
  Object.defineProperty(file, "size", { value: size })
  return file
}

function dropZone(): HTMLElement {
  const zone = screen.getByLabelText("Résumé file").parentElement
  if (!zone) {
    throw new Error("drop zone not found")
  }
  return zone
}

async function open() {
  const user = userEvent.setup()
  renderWithQuery(<UploadResumeDialog />)
  await user.click(screen.getByRole("button", { name: /upload résumé/i }))
  await screen.findByRole("dialog")
  return user
}

describe("UploadResumeDialog", () => {
  it("derives a name from the chosen file so the field is never blank", async () => {
    const user = await open()

    await user.upload(screen.getByLabelText("Résumé file"), pdf())

    await waitFor(() =>
      expect(screen.getByLabelText("Name")).toHaveValue("senior engineer")
    )
  })

  it("rejects an unsupported file dropped past the accept filter", async () => {
    await open()

    fireEvent.drop(dropZone(), {
      dataTransfer: { files: [new File(["x"], "notes.txt", { type: "text/plain" })] },
    })

    expect(
      await screen.findByText("Only PDF and DOCX files are supported")
    ).toBeInTheDocument()
    expect(upload).not.toHaveBeenCalled()
  })

  it("rejects a file over the size limit before spending an upload", async () => {
    await open()

    fireEvent.drop(dropZone(), {
      dataTransfer: { files: [pdf("huge.pdf", 7 * 1024 * 1024)] },
    })

    expect(
      await screen.findByText("File must be smaller than 6.0 MB")
    ).toBeInTheDocument()
    expect(upload).not.toHaveBeenCalled()
  })

  it("keeps the submit button disabled until a file is chosen", async () => {
    await open()

    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled()
  })

  it("sends the file and name as multipart form data", async () => {
    upload.mockResolvedValueOnce({ id: "r-1", name: "senior engineer", file_url: "/x" })
    const user = await open()

    await user.upload(screen.getByLabelText("Résumé file"), pdf())
    await waitFor(() => expect(screen.getByRole("button", { name: "Upload" })).toBeEnabled())
    await user.click(screen.getByRole("button", { name: "Upload" }))

    await waitFor(() => expect(upload).toHaveBeenCalledOnce())

    const [path, formData] = upload.mock.calls[0]
    expect(path).toBe("/api/resumes")
    expect(formData.get("name")).toBe("senior engineer")
    expect((formData.get("file") as File).name).toBe("senior-engineer.pdf")
  })
})
