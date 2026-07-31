import { describe, expect, it } from "vitest"
import { formatScore, scoreBand, scoreLabel, scoreTextClass } from "./score"

describe("scoreBand", () => {
  it("places scores in the band the palette was validated for", () => {
    expect(scoreBand(0)).toBe("low")
    expect(scoreBand(49.9)).toBe("low")
    expect(scoreBand(50)).toBe("mid")
    expect(scoreBand(74.9)).toBe("mid")
    expect(scoreBand(75)).toBe("high")
    expect(scoreBand(100)).toBe("high")
  })

  it("gives every band a distinct class and label", () => {
    const classes = [scoreTextClass(10), scoreTextClass(60), scoreTextClass(90)]
    const labels = [scoreLabel(10), scoreLabel(60), scoreLabel(90)]

    expect(new Set(classes).size).toBe(3)
    expect(new Set(labels).size).toBe(3)
  })
})

describe("formatScore", () => {
  it("shows whole numbers without a decimal point", () => {
    expect(formatScore(82)).toBe("82")
  })

  it("keeps one decimal for fractional scores the backend can return", () => {
    expect(formatScore(82.45)).toBe("82.5")
    expect(formatScore(0.5)).toBe("0.5")
  })
})
