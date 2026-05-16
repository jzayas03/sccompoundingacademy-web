export const brand = {
  colors: {
    tealDeep: "#225560",
    teal: "#368798",
    chartreuse: "#E9EA8A",
    sand: "#EAE2D6",
    offWhite: "#F5F6F7",
    white: "#FFFFFF",
    black: "#000000",
    gray: {
      900: "#404040",
      700: "#666666",
      500: "#BABABA",
      300: "#E0E0E0",
      100: "#F5F5F5",
    },
  },
  gradient: {
    brand:
      "linear-gradient(90deg, #225560 0%, #368798 25%, #E9EA8A 50%, #EAE2D6 75%, #F5F6F7 100%)",
  },
  radii: {
    sm: "8px",
    md: "16px",
    lg: "20px",
    xl: "28px",
    pill: "9999px",
  },
  shadows: {
    soft: "0 4px 12px rgba(34, 85, 96, 0.08)",
    lift: "0 8px 24px rgba(34, 85, 96, 0.12)",
  },
  type: {
    heading: [
      "ITC Avant Garde Gothic Pro",
      "Century Gothic",
      "Futura",
      "Montserrat",
      "system-ui",
      "sans-serif",
    ],
    body: [
      "ITC Avant Garde Gothic Pro",
      "Century Gothic",
      "Futura",
      "Montserrat",
      "system-ui",
      "sans-serif",
    ],
    accent: ["Khmer MN", "Cormorant Garamond", "Garamond", "serif"],
  },
} as const;

export type BrandTokens = typeof brand;
