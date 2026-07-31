import { describe, expect, it } from "vitest"
import { render, screen, within } from "@/test/render"
import { AppShell } from "./app-shell"

function shell() {
  return render(
    <AppShell userMenu={<button type="button">Account</button>}>
      <h1>Dashboard</h1>
    </AppShell>
  )
}

describe("AppShell", () => {
  it("offers a skip link that targets the main landmark", () => {
    shell()

    const skip = screen.getByRole("link", { name: "Skip to content" })

    expect(skip).toHaveAttribute("href", "#main")
    expect(screen.getByRole("main")).toHaveAttribute("id", "main")
  })

  it("gives every icon-only control an accessible name", () => {
    shell()

    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveAccessibleName()
    }
  })

  it("marks the section matching the current path", () => {
    shell()

    const sidebar = within(screen.getAllByRole("navigation")[0])
    const dashboard = sidebar.getByRole("link", { name: "Dashboard" })

    expect(dashboard).toHaveAttribute("aria-current", "page")

    for (const link of sidebar.getAllByRole("link")) {
      if (link !== dashboard) {
        expect(link).not.toHaveAttribute("aria-current")
      }
    }
  })

  it("renders the user menu slot rather than importing the auth module", () => {
    shell()

    expect(screen.getByRole("button", { name: "Account" })).toBeInTheDocument()
  })
})
