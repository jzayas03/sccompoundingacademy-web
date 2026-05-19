// Source of truth: Compounding Academy Brandsheet.pdf
//   tealDeep   #195561   primary background
//   teal       #228698   secondary surfaces / mid-band dividers
//   chartreuse #E6EA82   primary accent (CTAs, brand mark fills)
//   sand       #EAE1D6   warm neutral surface
//   offWhite   #F3F3F4   light surface / body text on dark bg
export const brand = {
  colors: {
    tealDeep: "#195561",
    teal: "#228698",
    chartreuse: "#E6EA82",
    sand: "#EAE1D6",
    offWhite: "#F3F3F4",
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
      "linear-gradient(90deg, #195561 0%, #228698 25%, #E6EA82 50%, #EAE1D6 75%, #F3F3F4 100%)",
  },
  radii: {
    sm: "8px",
    md: "16px",
    lg: "20px",
    xl: "28px",
    pill: "9999px",
  },
  shadows: {
    // rgba derived from tealDeep #195561 = rgb(25, 85, 97)
    soft: "0 4px 12px rgba(25, 85, 97, 0.08)",
    lift: "0 8px 24px rgba(25, 85, 97, 0.12)",
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

// Glassmorphism — medium intensity. Mirrors the CSS utilities defined in
// `src/app/globals.css` under @layer components (.glass-card, .glass-nav,
// .glass-modal, .glass-card-hover). Kept here as a TS reference so the
// values have a single source of truth alongside the rest of the brand
// tokens; components apply them via the Tailwind utility classes rather
// than reading these constants at render time.
export const glass = {
  card: {
    background: "rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    boxShadow: "0 8px 32px rgba(25, 85, 97, 0.12)",
  },
  cardHover: {
    background: "rgba(255, 255, 255, 0.12)",
    border: "1px solid rgba(233, 234, 138, 0.4)",
  },
  nav: {
    background: "rgba(245, 246, 247, 0.7)",
    backdropFilter: "blur(16px)",
  },
  modal: {
    background: "rgba(245, 246, 247, 0.85)",
    backdropFilter: "blur(24px)",
  },
} as const;

export type BrandTokens = typeof brand;
