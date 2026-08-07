function channelLuminance(value: number): number {
  const v = value / 255
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

const DARK_INK = "#111111"
/** Relative luminance of DARK_INK, precomputed. */
const DARK_INK_LUMINANCE = 0.00518

/**
 * Picks white or near-black text for a user-chosen background colour, whichever
 * has more contrast. Category colours come from a colour picker, so a fixed
 * white label would go unreadable the moment someone picks pale yellow.
 */
export function readableOn(color?: string | null): string {
  if (!color || !color.startsWith("#")) return "#ffffff"

  let hex = color.slice(1)
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("")
  }
  if (hex.length !== 6 || !/^[0-9a-f]{6}$/i.test(hex)) return "#ffffff"

  const luminance =
    0.2126 * channelLuminance(parseInt(hex.slice(0, 2), 16)) +
    0.7152 * channelLuminance(parseInt(hex.slice(2, 4), 16)) +
    0.0722 * channelLuminance(parseInt(hex.slice(4, 6), 16))

  const againstWhite = 1.05 / (luminance + 0.05)
  const againstDark = (luminance + 0.05) / (DARK_INK_LUMINANCE + 0.05)

  return againstWhite >= againstDark ? "#ffffff" : DARK_INK
}
