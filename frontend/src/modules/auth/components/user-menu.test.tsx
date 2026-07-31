import { describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import { renderWithQuery, screen } from "@/test/render"
import { UserMenu } from "./user-menu"

vi.mock("@/shared/api/client", async () => {
  const actual = await vi.importActual<typeof import("@/shared/api/client")>(
    "@/shared/api/client"
  )

  return {
    ...actual,
    api: {
      ...actual.api,
      get: vi.fn(async () => ({
        id: "u-1",
        email: "abel@example.com",
        name: "Abel Guta",
        created_at: "2026-07-31T00:00:00Z",
      })),
      post: vi.fn(async () => undefined),
    },
  }
})

describe("UserMenu", () => {
  it("opens without throwing and shows the signed-in identity", async () => {
    const user = userEvent.setup()
    renderWithQuery(<UserMenu />)

    const trigger = await screen.findByRole("button", { name: "Account menu" })
    await user.click(trigger)

    expect(await screen.findByText("Abel Guta")).toBeInTheDocument()
    expect(screen.getByText("abel@example.com")).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /sign out/i })).toBeInTheDocument()
  })
})
