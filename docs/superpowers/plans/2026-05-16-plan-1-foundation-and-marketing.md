# Plan 1 — Foundation & Marketing Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a bilingual (ES/EN), pixel-on-brand SCCA marketing site with a scroll-driven Blender mortar — no payments, no DB.

**Architecture:** Next.js 15 (App Router, TypeScript strict) on Vercel. Tailwind 4 with brand tokens centralized in `/src/lib/brand.ts` and lint-enforced. `next-intl` for ES/EN with translated slugs. Contact form posts to a Resend-backed API route (no DB). 3D hero is an Eevee-rendered 80-frame WebP sequence scrubbed via IntersectionObserver + rAF.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.5+, Tailwind 4, next-intl 3, Resend, Vitest, Playwright, Blender 4.x (asset production), Sharp (image pipeline).

**Spec:** [`docs/superpowers/specs/2026-05-16-scca-landing-page-design.md`](../specs/2026-05-16-scca-landing-page-design.md)

---

## File structure (locked in before tasks)

```
sccompoundingacademy-web/
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── .prettierrc
├── .env.example
├── vitest.config.ts
├── playwright.config.ts
├── middleware.ts
├── src/
│   ├── lib/
│   │   ├── brand.ts                     SINGLE source of truth for tokens
│   │   ├── cn.ts                        Tailwind class merging utility
│   │   └── seo.ts                       per-page metadata helpers
│   ├── i18n/
│   │   ├── routing.ts                   locales + pathname map
│   │   └── request.ts                   server-side message loader
│   ├── messages/
│   │   ├── en.json
│   │   └── es.json
│   ├── app/
│   │   ├── layout.tsx                   root: <html> + fonts vars only
│   │   ├── globals.css                  Tailwind 4 inline config
│   │   ├── fonts.ts                     next/font configuration
│   │   ├── not-found.tsx
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   ├── [locale]/
│   │   │   ├── layout.tsx               locale layout: header + footer
│   │   │   ├── page.tsx                 landing page (composes sections)
│   │   │   ├── cursos/page.tsx          (ES) catalog placeholder
│   │   │   ├── courses/page.tsx         (EN) catalog placeholder
│   │   │   ├── contacto/page.tsx        (ES) contact
│   │   │   ├── contact/page.tsx         (EN) contact
│   │   │   └── legal/
│   │   │       ├── privacidad/page.tsx  (ES)
│   │   │       ├── privacy/page.tsx     (EN)
│   │   │       ├── terminos/page.tsx    (ES)
│   │   │       └── terms/page.tsx       (EN)
│   │   └── api/
│   │       └── contact/route.ts
│   ├── components/
│   │   ├── brand/
│   │   │   ├── LogoShield.tsx
│   │   │   ├── LogoShieldInverse.tsx
│   │   │   ├── LogoFull.tsx
│   │   │   ├── LogoFullInverse.tsx
│   │   │   ├── Wordmark.tsx
│   │   │   ├── Pattern.tsx
│   │   │   └── index.ts
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Container.tsx
│   │   │   ├── SectionBand.tsx
│   │   │   ├── Heading.tsx
│   │   │   ├── LocaleSwitch.tsx
│   │   │   ├── Accordion.tsx
│   │   │   ├── FormField.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   └── marketing/
│   │       ├── HeroBillboard.tsx
│   │       ├── HeroMortar.tsx
│   │       ├── TaglineBand.tsx
│   │       ├── FeaturedCoursesPlaceholder.tsx
│   │       ├── WhySCCA.tsx
│   │       ├── InstructorSection.tsx
│   │       ├── PatternDivider.tsx
│   │       ├── FAQ.tsx
│   │       └── FooterCTA.tsx
│   └── eslint-rules/
│       └── no-hex-literal.js            custom ESLint rule
├── public/
│   ├── favicon.ico
│   ├── icon.svg
│   ├── apple-touch-icon.png
│   ├── og-image-es.png
│   ├── og-image-en.png
│   ├── hero/
│   │   ├── mortar/                      80 WebP frames (gitignored)
│   │   │   └── manifest.json            committed
│   │   ├── mortar-poster.webp           fallback for reduced-motion
│   │   └── pharmacist-placeholder.webp
├── blender/
│   ├── mortar.blend                     committed source
│   ├── README.md                        re-render instructions
│   └── renders/                         (gitignored)
├── scripts/
│   └── build-mortar-frames.mjs          PNG→WebP+manifest pipeline
└── tests/
    ├── unit/
    │   └── brand.test.ts
    ├── components/
    │   ├── LocaleSwitch.test.tsx
    │   ├── Accordion.test.tsx
    │   └── FormField.test.tsx
    └── e2e/
        ├── locale-routing.spec.ts
        ├── contact-form.spec.ts
        └── brand-lint.spec.ts
```

---

## Conventions used in this plan

- **Working directory** for every command: `~/Desktop/sccompoundingacademy-web` (the repo root). Where this matters, the command shows `cd ~/Desktop/sccompoundingacademy-web && …`.
- **Package manager:** `pnpm` (recommended) — if you prefer `npm` or `yarn`, replace `pnpm install` with `npm install` etc.
- **Node version:** ≥ 20.11.
- **Commits:** one per task. Conventional Commits style (`feat:`, `chore:`, `test:`, `docs:`, `fix:`). End every message with the `Co-Authored-By` line if you're working with Claude.

---

## Task 1 — Initialize the Next.js project

**Files:**

- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `next-env.d.ts`, `.gitignore` additions

- [ ] **Step 1: Run create-next-app non-interactively**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm dlx create-next-app@latest . \
  --typescript --tailwind --eslint --app --src-dir --turbopack \
  --import-alias "@/*" --no-git --use-pnpm --yes
```

Expected: a `src/` directory, `package.json` with `next@15.x`, `react@19.x`, `tailwindcss@4.x`, `eslint-config-next`. The `--no-git` flag prevents create-next-app from clobbering our existing `.git` directory.

- [ ] **Step 2: Verify the dev server starts**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm dev
```

Expected: server listens on `http://localhost:3000`, default Next.js page renders. **Kill the server (Ctrl-C) before continuing.**

- [ ] **Step 3: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "chore: scaffold Next.js 15 + Tailwind 4 + TS

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2 — Install runtime dependencies

**Files:** `package.json`

- [ ] **Step 1: Install runtime libraries**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm add \
  next-intl@^3.26 \
  resend@^4.0 \
  zod@^3.23 \
  clsx@^2.1 \
  tailwind-merge@^2.5
```

Expected: deps added to `package.json`. Confirm `node_modules/next-intl` exists.

- [ ] **Step 2: Install dev dependencies**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm add -D \
  vitest@^2 \
  @vitest/ui@^2 \
  @testing-library/react@^16 \
  @testing-library/jest-dom@^6 \
  @testing-library/user-event@^14 \
  jsdom@^25 \
  @playwright/test@^1.49 \
  prettier@^3.4 \
  prettier-plugin-tailwindcss@^0.6 \
  sharp@^0.33
```

Expected: deps added under `devDependencies`.

- [ ] **Step 3: Install Playwright browsers**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm exec playwright install --with-deps chromium
```

Expected: chromium installed under `~/Library/Caches/ms-playwright/`. (Pick `chromium` only — we don't need Firefox/Safari for this work, saves ~700 MB.)

- [ ] **Step 4: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "chore: install next-intl, resend, testing harness

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3 — Strict TypeScript & Prettier

**Files:**

- Modify: `tsconfig.json`
- Create: `.prettierrc`

- [ ] **Step 1: Tighten `tsconfig.json`**

Replace the `compilerOptions` block in `tsconfig.json` so the file looks exactly like:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 2: Create `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- [ ] **Step 3: Verify typecheck still passes**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm exec tsc --noEmit
```

Expected: zero output (success).

- [ ] **Step 4: Add npm scripts**

Add to `package.json` under `"scripts"`:

```json
"typecheck": "tsc --noEmit",
"format": "prettier --write .",
"format:check": "prettier --check ."
```

- [ ] **Step 5: Format the codebase**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm format
```

- [ ] **Step 6: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "chore: enable strict TS + Prettier config

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4 — Vitest setup

**Files:**

- Create: `vitest.config.ts`, `vitest.setup.ts`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["tests/unit/**/*.test.ts", "tests/components/**/*.test.tsx"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 2: Install `@vitejs/plugin-react`**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm add -D @vitejs/plugin-react@^4.3
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 4: Add test scripts to `package.json`**

Add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test"
```

- [ ] **Step 5: Write a sanity test**

Create `tests/unit/sanity.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("sanity", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run it**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm test
```

Expected: 1 test passes.

- [ ] **Step 7: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "chore: set up Vitest + Testing Library

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5 — Playwright setup

**Files:**

- Create: `playwright.config.ts`

- [ ] **Step 1: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 2: Write a sanity E2E test**

Create `tests/e2e/sanity.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/.+/);
});
```

- [ ] **Step 3: Run it**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm test:e2e
```

Expected: 1 test passes. (Playwright starts the dev server, hits `/`, asserts a non-empty title.)

- [ ] **Step 4: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "chore: set up Playwright (chromium-only)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6 — Tailwind merge + cn() utility

**Files:**

- Create: `src/lib/cn.ts`, `tests/unit/cn.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/cn.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/cn";

describe("cn", () => {
  it("joins classnames", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("dedupes conflicting tailwind classes (later wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
  it("filters falsy", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });
});
```

- [ ] **Step 2: Run it (should fail — module missing)**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm test tests/unit/cn.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/cn'`.

- [ ] **Step 3: Implement `src/lib/cn.ts`**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Run the test (should pass)**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm test tests/unit/cn.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(lib): add cn() classname utility

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7 — Brand tokens (`src/lib/brand.ts`)

**Files:**

- Create: `src/lib/brand.ts`, `tests/unit/brand.test.ts`

- [ ] **Step 1: Write the test**

Create `tests/unit/brand.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { brand } from "@/lib/brand";

describe("brand tokens", () => {
  it("exposes the five core hex values exactly", () => {
    expect(brand.colors.tealDeep).toBe("#225560");
    expect(brand.colors.teal).toBe("#368798");
    expect(brand.colors.chartreuse).toBe("#E9EA8A");
    expect(brand.colors.sand).toBe("#EAE2D6");
    expect(brand.colors.offWhite).toBe("#F5F6F7");
  });

  it("exposes the gray ramp", () => {
    expect(brand.colors.gray).toEqual({
      900: "#404040",
      700: "#666666",
      500: "#BABABA",
      300: "#E0E0E0",
      100: "#F5F5F5",
    });
  });

  it("exposes the brand gradient", () => {
    expect(brand.gradient.brand).toContain("#225560");
    expect(brand.gradient.brand).toContain("#368798");
    expect(brand.gradient.brand).toContain("#E9EA8A");
    expect(brand.gradient.brand).toContain("#EAE2D6");
    expect(brand.gradient.brand).toContain("#F5F6F7");
  });

  it("exposes type stacks with Avant Garde first", () => {
    expect(brand.type.heading[0]).toBe("ITC Avant Garde Gothic Pro");
    expect(brand.type.heading).toContain("Montserrat");
    expect(brand.type.accent[0]).toBe("Khmer MN");
  });
});
```

- [ ] **Step 2: Run it (should fail)**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm test tests/unit/brand.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/brand.ts`**

```ts
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
```

- [ ] **Step 4: Run the test (should pass)**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm test tests/unit/brand.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(brand): add lib/brand.ts as canonical token source

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8 — Wire Tailwind 4 to brand tokens

**Files:**

- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace `src/app/globals.css` entirely**

```css
@import "tailwindcss";

@theme {
  --color-teal-deep: #225560;
  --color-teal: #368798;
  --color-chartreuse: #e9ea8a;
  --color-sand: #eae2d6;
  --color-off-white: #f5f6f7;

  --color-gray-900: #404040;
  --color-gray-700: #666666;
  --color-gray-500: #bababa;
  --color-gray-300: #e0e0e0;
  --color-gray-100: #f5f5f5;

  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --radius-pill: 9999px;

  --shadow-soft: 0 4px 12px rgba(34, 85, 96, 0.08);
  --shadow-lift: 0 8px 24px rgba(34, 85, 96, 0.12);

  --font-heading:
    "ITC Avant Garde Gothic Pro", "Century Gothic", "Futura", "Montserrat", system-ui, sans-serif;
  --font-body: var(--font-heading);
  --font-accent: "Khmer MN", "Cormorant Garamond", "Garamond", serif;

  --background-image-brand-gradient: linear-gradient(
    90deg,
    #225560 0%,
    #368798 25%,
    #e9ea8a 50%,
    #eae2d6 75%,
    #f5f6f7 100%
  );
}

@layer base {
  html {
    color: var(--color-gray-900);
    background: var(--color-off-white);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: var(--font-heading);
    letter-spacing: -0.01em;
  }
  ::selection {
    background: var(--color-chartreuse);
    color: var(--color-teal-deep);
  }
}
```

- [ ] **Step 2: Replace `src/app/page.tsx` with a temporary token-check page**

```tsx
export default function Page() {
  return (
    <main className="bg-teal-deep min-h-screen p-8">
      <h1 className="font-heading text-chartreuse text-4xl">SCCA tokens wired</h1>
      <p className="text-off-white mt-2">
        If this is teal+chartreuse, Tailwind reads from brand tokens.
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Visual check**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm dev
```

Open `http://localhost:3000` — page should be deep teal with chartreuse headline. Kill server.

- [ ] **Step 4: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(style): wire Tailwind 4 theme to brand tokens

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9 — ESLint rule blocking hex literals

**Files:**

- Create: `src/eslint-rules/no-hex-literal.js`, `tests/unit/no-hex-literal.test.ts`
- Modify: `eslint.config.mjs`

- [ ] **Step 1: Create the custom rule `src/eslint-rules/no-hex-literal.js`**

```js
// Custom ESLint rule: disallow #RRGGBB / #RGB literals in code, except inside lib/brand.ts.
// CommonJS so eslint can require it directly.
const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

module.exports = {
  meta: {
    type: "problem",
    docs: { description: "No hex color literals outside /lib/brand.ts" },
    schema: [],
    messages: {
      noHex: "No hex literals ('{{value}}'). Use brand tokens from @/lib/brand.",
    },
  },
  create(context) {
    const file = context.filename ?? context.getFilename();
    if (file.replaceAll("\\", "/").endsWith("/src/lib/brand.ts")) return {};
    return {
      Literal(node) {
        if (typeof node.value === "string" && HEX.test(node.value)) {
          context.report({ node, messageId: "noHex", data: { value: node.value } });
        }
      },
      TemplateElement(node) {
        const raw = node.value?.cooked ?? "";
        const match = raw.match(/#(?:[0-9a-fA-F]{3,8})\b/);
        if (match) {
          context.report({ node, messageId: "noHex", data: { value: match[0] } });
        }
      },
    };
  },
};
```

- [ ] **Step 2: Replace `eslint.config.mjs`**

```js
import next from "eslint-config-next";
import noHexLiteral from "./src/eslint-rules/no-hex-literal.js";

export default [
  ...next,
  {
    plugins: { "scca-brand": { rules: { "no-hex-literal": noHexLiteral } } },
    rules: {
      "scca-brand/no-hex-literal": "error",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "public/**"],
  },
];
```

- [ ] **Step 3: Verify the rule fires**

Create a temporary file `src/_brand_lint_check.ts`:

```ts
export const bad = "#225560";
```

Then:

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm exec eslint src/_brand_lint_check.ts
```

Expected: error `No hex literals ('#225560'). Use brand tokens from @/lib/brand.`

Remove the file:

```bash
rm src/_brand_lint_check.ts
```

- [ ] **Step 4: Verify `brand.ts` itself does NOT fire**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm exec eslint src/lib/brand.ts
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(lint): add no-hex-literal rule (allowlists lib/brand.ts)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10 — Fonts via next/font

**Files:**

- Create: `src/app/fonts.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create `src/app/fonts.ts`**

```ts
import { Montserrat, Cormorant_Garamond } from "next/font/google";

export const heading = Montserrat({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-heading-loaded",
});

export const accent = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-accent-loaded",
});
```

- [ ] **Step 2: Replace `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { heading, accent } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Santa Cruz Compounding Academy",
  description: "Educamos para formar bienestar y salud.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${heading.variable} ${accent.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Update `@theme` block to use the loaded font variables**

In `src/app/globals.css`, change the `--font-heading` and `--font-accent` lines inside `@theme` to:

```css
--font-heading:
  var(--font-heading-loaded), "ITC Avant Garde Gothic Pro", "Century Gothic", "Futura",
  "Montserrat", system-ui, sans-serif;
--font-body: var(--font-heading);
--font-accent: var(--font-accent-loaded), "Khmer MN", "Cormorant Garamond", "Garamond", serif;
```

- [ ] **Step 4: Visual check**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm dev
```

Open `http://localhost:3000` — the headline should now render in Montserrat. Kill server.

- [ ] **Step 5: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(fonts): load Montserrat + Cormorant Garamond via next/font

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11 — i18n routing config

**Files:**

- Create: `src/i18n/routing.ts`, `src/i18n/request.ts`, `middleware.ts`, `src/messages/en.json`, `src/messages/es.json`
- Modify: `next.config.ts`

- [ ] **Step 1: Create `src/i18n/routing.ts`**

```ts
import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/cursos": { es: "/cursos", en: "/courses" },
    "/contacto": { es: "/contacto", en: "/contact" },
    "/legal/privacidad": { es: "/legal/privacidad", en: "/legal/privacy" },
    "/legal/terminos": { es: "/legal/terminos", en: "/legal/terms" },
  },
});

export type AppPathname = keyof typeof routing.pathnames;

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
```

- [ ] **Step 2: Create `src/i18n/request.ts`**

```ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "es" | "en")) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 3: Create `middleware.ts`** (in the repo root, NOT under `src/`)

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 4: Update `next.config.ts`**

Replace `next.config.ts` with:

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
```

- [ ] **Step 5: Create starter message files**

`src/messages/es.json`:

```json
{
  "nav": {
    "home": "Inicio",
    "courses": "Cursos",
    "about": "Sobre",
    "contact": "Contacto",
    "enroll": "Inscribirme"
  },
  "hero": {
    "eyebrow": "Academia de Compounding",
    "headline": "Tu próxima certificación comienza aquí.",
    "subhead": "Certificación profesional en USP 795 y USP 800.",
    "primaryCta": "Ver cursos",
    "secondaryCta": "Conoce más"
  },
  "tagline": {
    "line1": "Educamos para formar",
    "line2": "Bienestar y salud."
  },
  "featured": {
    "title": "Cursos destacados",
    "comingSoon": "Próximamente",
    "viewAll": "Ver todos los cursos"
  },
  "whySCCA": {
    "title": "Por qué SCCA",
    "items": {
      "instructor": {
        "title": "Instructor certificado",
        "body": "Décadas de experiencia en compounding farmacéutico."
      },
      "cohorts": {
        "title": "Cohortes pequeñas",
        "body": "Aprendizaje supervisado, dudas resueltas en tiempo real."
      },
      "usp": {
        "title": "Alineado con USP 795 y USP 800",
        "body": "Currículo mapeado a los capítulos de la USP."
      },
      "certification": {
        "title": "Certificación al completar",
        "body": "Recibe tu certificado profesional al finalizar el programa."
      }
    }
  },
  "instructor": {
    "title": "Tu instructor",
    "bioPlaceholder": "Biografía del instructor (próximamente)."
  },
  "faq": {
    "title": "Preguntas frecuentes",
    "items": [
      { "q": "¿Cómo se imparten los cursos?", "a": "En línea o presencial, según la cohorte." },
      {
        "q": "¿Qué es USP 795?",
        "a": "El capítulo de la USP que define la práctica de compounding no estéril."
      },
      {
        "q": "¿Qué es USP 800?",
        "a": "El capítulo de la USP sobre manejo seguro de medicamentos peligrosos."
      },
      {
        "q": "¿Recibo certificación?",
        "a": "Sí — un certificado de SCCA al completar el programa."
      },
      { "q": "¿Aceptan tarjeta de crédito?", "a": "Sí — pago seguro con tarjeta vía Stripe." },
      {
        "q": "¿Puedo solicitar reembolso?",
        "a": "Sí, hasta 7 días antes del inicio de la cohorte."
      }
    ]
  },
  "footerCta": {
    "headline": "¿Listo para certificarte?",
    "subhead": "Únete a la próxima cohorte de SCCA.",
    "button": "Ver cursos"
  },
  "footer": {
    "tagline": "Educamos para formar bienestar y salud.",
    "contact": "Contacto",
    "legal": "Legal",
    "privacy": "Privacidad",
    "terms": "Términos",
    "copyright": "© {year} Santa Cruz Compounding Academy. Todos los derechos reservados."
  },
  "contact": {
    "title": "Contáctanos",
    "subhead": "¿Preguntas sobre nuestros cursos? Escríbenos.",
    "name": "Nombre",
    "email": "Correo electrónico",
    "phone": "Teléfono (opcional)",
    "subject": "Asunto",
    "message": "Mensaje",
    "submit": "Enviar mensaje",
    "submitting": "Enviando…",
    "success": "Gracias — te responderemos pronto.",
    "error": "Algo salió mal. Inténtalo de nuevo."
  },
  "courses": {
    "title": "Cursos",
    "comingSoonNotice": "Catálogo completo próximamente. Mientras tanto, contáctanos para consultas."
  },
  "legal": {
    "privacy": {
      "title": "Política de privacidad",
      "body": "Documento en preparación. Para preguntas, escríbenos a contacto."
    },
    "terms": {
      "title": "Términos y condiciones",
      "body": "Documento en preparación. Para preguntas, escríbenos a contacto."
    }
  },
  "common": {
    "languageToggle": "Idioma",
    "skipToContent": "Saltar al contenido"
  }
}
```

`src/messages/en.json` (mirror structure, English values):

```json
{
  "nav": {
    "home": "Home",
    "courses": "Courses",
    "about": "About",
    "contact": "Contact",
    "enroll": "Enroll"
  },
  "hero": {
    "eyebrow": "Compounding Academy",
    "headline": "Your next certification starts here.",
    "subhead": "Professional certification in USP 795 and USP 800.",
    "primaryCta": "Browse courses",
    "secondaryCta": "Learn more"
  },
  "tagline": {
    "line1": "We educate to build",
    "line2": "Wellness and health."
  },
  "featured": {
    "title": "Featured courses",
    "comingSoon": "Coming soon",
    "viewAll": "View all courses"
  },
  "whySCCA": {
    "title": "Why SCCA",
    "items": {
      "instructor": {
        "title": "Certified instructor",
        "body": "Decades of compounding pharmacy experience."
      },
      "cohorts": {
        "title": "Small cohorts",
        "body": "Supervised learning with real-time feedback."
      },
      "usp": {
        "title": "Aligned with USP 795 & USP 800",
        "body": "Curriculum mapped to USP chapter standards."
      },
      "certification": {
        "title": "Certification on completion",
        "body": "Receive your professional certificate at program completion."
      }
    }
  },
  "instructor": {
    "title": "Your instructor",
    "bioPlaceholder": "Instructor bio coming soon."
  },
  "faq": {
    "title": "Frequently asked questions",
    "items": [
      { "q": "How are courses delivered?", "a": "Online or in person, depending on the cohort." },
      {
        "q": "What is USP 795?",
        "a": "The USP chapter that defines non-sterile compounding practice."
      },
      { "q": "What is USP 800?", "a": "The USP chapter on safe handling of hazardous drugs." },
      {
        "q": "Do I get a certificate?",
        "a": "Yes — an SCCA professional certificate on completion."
      },
      { "q": "Do you accept credit cards?", "a": "Yes — secure card payment via Stripe." },
      { "q": "Can I request a refund?", "a": "Yes, up to 7 days before the cohort start." }
    ]
  },
  "footerCta": {
    "headline": "Ready to certify?",
    "subhead": "Join SCCA's next cohort.",
    "button": "Browse courses"
  },
  "footer": {
    "tagline": "We educate to build wellness and health.",
    "contact": "Contact",
    "legal": "Legal",
    "privacy": "Privacy",
    "terms": "Terms",
    "copyright": "© {year} Santa Cruz Compounding Academy. All rights reserved."
  },
  "contact": {
    "title": "Contact us",
    "subhead": "Questions about our courses? Write to us.",
    "name": "Name",
    "email": "Email",
    "phone": "Phone (optional)",
    "subject": "Subject",
    "message": "Message",
    "submit": "Send message",
    "submitting": "Sending…",
    "success": "Thanks — we'll be in touch shortly.",
    "error": "Something went wrong. Please try again."
  },
  "courses": {
    "title": "Courses",
    "comingSoonNotice": "Full catalog coming soon. In the meantime, contact us with questions."
  },
  "legal": {
    "privacy": {
      "title": "Privacy policy",
      "body": "Document in progress. For questions, contact us."
    },
    "terms": {
      "title": "Terms & conditions",
      "body": "Document in progress. For questions, contact us."
    }
  },
  "common": {
    "languageToggle": "Language",
    "skipToContent": "Skip to content"
  }
}
```

- [ ] **Step 6: Move `app/page.tsx` content under `[locale]`**

Delete `src/app/page.tsx` and create `src/app/[locale]/page.tsx`:

```tsx
import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

export default function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  return <LandingPageContent params={params} />;
}

async function LandingPageContent({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LandingPageInner />;
}

function LandingPageInner() {
  const t = useTranslations("hero");
  return (
    <main className="bg-teal-deep min-h-screen p-8">
      <h1 className="font-heading text-chartreuse text-4xl">{t("headline")}</h1>
      <p className="text-off-white mt-2">{t("subhead")}</p>
    </main>
  );
}
```

Also create `src/app/[locale]/layout.tsx`:

```tsx
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "es" | "en")) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();
  return <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>;
}
```

Also update root `src/app/layout.tsx` to accept the locale param via children only (no `<html lang="es">` hardcode):

```tsx
import type { Metadata } from "next";
import { heading, accent } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Santa Cruz Compounding Academy",
  description: "Educamos para formar bienestar y salud.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${heading.variable} ${accent.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

(We set `lang` on `<html>` in a later task once we can read locale at the root — for now Next.js doesn't expose it cleanly at the root layout, so this is acceptable for this step.)

- [ ] **Step 7: Verify locale routing works**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm dev
```

Visit `http://localhost:3000` → should redirect to `/es`.
Visit `http://localhost:3000/en` → should show "Your next certification starts here."
Visit `http://localhost:3000/es` → should show "Tu próxima certificación comienza aquí."

Kill the server.

- [ ] **Step 8: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(i18n): wire next-intl with ES/EN and translated slugs

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 12 — CI guard: message-key parity

**Files:**

- Create: `scripts/check-i18n-parity.mjs`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Create `scripts/check-i18n-parity.mjs`**

```js
import fs from "node:fs";
import path from "node:path";

const messagesDir = path.resolve("src/messages");
const files = fs.readdirSync(messagesDir).filter((f) => f.endsWith(".json"));
const sets = {};

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(messagesDir, file), "utf8"));
  const keys = new Set();
  const walk = (obj, prefix = "") => {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) walk(v, key);
      else keys.add(key);
    }
  };
  walk(data);
  sets[file] = keys;
}

const all = new Set([...Object.values(sets).flatMap((s) => [...s])]);
let ok = true;
for (const file of files) {
  const missing = [...all].filter((k) => !sets[file].has(k));
  if (missing.length) {
    ok = false;
    console.error(`Missing keys in ${file}:\n  ${missing.join("\n  ")}`);
  }
}
if (!ok) process.exit(1);
console.log(`i18n parity OK across ${files.join(", ")} (${all.size} keys).`);
```

- [ ] **Step 2: Add to `package.json` scripts**

```json
"check:i18n": "node scripts/check-i18n-parity.mjs"
```

- [ ] **Step 3: Run it**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm check:i18n
```

Expected: `i18n parity OK across en.json, es.json (NN keys).`

- [ ] **Step 4: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "chore(i18n): add CI parity check for message files

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 13 — E2E: locale routing

**Files:**

- Modify: `tests/e2e/sanity.spec.ts` → rename to `locale-routing.spec.ts`

- [ ] **Step 1: Replace `tests/e2e/sanity.spec.ts` content and rename**

```bash
cd ~/Desktop/sccompoundingacademy-web && mv tests/e2e/sanity.spec.ts tests/e2e/locale-routing.spec.ts
```

Write `tests/e2e/locale-routing.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("root redirects to /es by default", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/es(\/|$)/);
});

test("/en renders English headline", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your next certification starts here",
  );
});

test("/es renders Spanish headline", async ({ page }) => {
  await page.goto("/es");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Tu próxima certificación comienza aquí",
  );
});
```

- [ ] **Step 2: Run it**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm test:e2e
```

Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "test(e2e): verify locale routing redirects + translations

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 14 — UI primitive: Container

**Files:**

- Create: `src/components/ui/Container.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { cn } from "@/lib/cn";

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>
  );
}
```

- [ ] **Step 2: Lint + typecheck**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm typecheck && pnpm exec eslint src/components/ui/Container.tsx
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(ui): add Container primitive

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 15 — UI primitive: Heading

**Files:**

- Create: `src/components/ui/Heading.tsx`

- [ ] **Step 1: Create**

```tsx
import { cn } from "@/lib/cn";

const SIZES = {
  display: "text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05]",
  h1: "text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight",
  h2: "text-3xl sm:text-4xl font-bold leading-tight",
  h3: "text-2xl sm:text-3xl font-semibold leading-snug",
  h4: "text-xl font-semibold leading-snug",
} as const;

export function Heading({
  as: Tag = "h2",
  size = "h2",
  className,
  children,
}: {
  as?: "h1" | "h2" | "h3" | "h4";
  size?: keyof typeof SIZES;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag className={cn("font-heading tracking-tight", SIZES[size], className)}>{children}</Tag>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(ui): add Heading primitive

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 16 — UI primitive: Button

**Files:**

- Create: `src/components/ui/Button.tsx`

- [ ] **Step 1: Create**

```tsx
import { cn } from "@/lib/cn";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "inverse";
type Size = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center font-heading font-semibold rounded-md " +
  "transition-colors focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-chartreuse focus-visible:ring-offset-2 focus-visible:ring-offset-teal-deep " +
  "disabled:opacity-50 disabled:pointer-events-none";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-chartreuse text-teal-deep hover:bg-chartreuse/90",
  secondary: "border-2 border-teal-deep text-teal-deep hover:bg-teal-deep hover:text-off-white",
  ghost: "text-teal-deep hover:bg-sand",
  inverse: "bg-off-white text-teal-deep hover:bg-sand",
};

const SIZES: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-base",
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", className, ...rest },
  ref,
) {
  return (
    <button ref={ref} className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...rest} />
  );
});
```

- [ ] **Step 2: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(ui): add Button primitive with brand variants

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 17 — UI primitive: Card, Badge, SectionBand

**Files:**

- Create: `src/components/ui/Card.tsx`, `src/components/ui/Badge.tsx`, `src/components/ui/SectionBand.tsx`

- [ ] **Step 1: Create `Card.tsx`**

```tsx
import { cn } from "@/lib/cn";

export function Card({
  tone = "off-white",
  className,
  children,
}: {
  tone?: "off-white" | "sand" | "white";
  className?: string;
  children: React.ReactNode;
}) {
  const toneClasses = {
    "off-white": "bg-off-white",
    sand: "bg-sand",
    white: "bg-white",
  } as const;
  return (
    <div
      className={cn(
        "rounded-2xl p-6 shadow-[var(--shadow-soft)] sm:p-8",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create `Badge.tsx`**

```tsx
import { cn } from "@/lib/cn";

type Tone = "teal" | "chartreuse" | "sand";

const TONES: Record<Tone, string> = {
  teal: "bg-teal-deep text-chartreuse",
  chartreuse: "bg-chartreuse text-teal-deep",
  sand: "bg-sand text-teal-deep",
};

export function Badge({
  tone = "teal",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 3: Create `SectionBand.tsx`**

```tsx
import { cn } from "@/lib/cn";

type Tone = "teal-deep" | "teal" | "sand" | "off-white" | "white";

const TONES: Record<Tone, string> = {
  "teal-deep": "bg-teal-deep text-off-white",
  teal: "bg-teal text-off-white",
  sand: "bg-sand text-teal-deep",
  "off-white": "bg-off-white text-teal-deep",
  white: "bg-white text-teal-deep",
};

export function SectionBand({
  tone = "off-white",
  className,
  children,
  id,
}: {
  tone?: Tone;
  className?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("w-full py-16 sm:py-24", TONES[tone], className)}>
      {children}
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(ui): add Card, Badge, SectionBand primitives

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 18 — UI primitive: LocaleSwitch (with component test)

**Files:**

- Create: `src/components/ui/LocaleSwitch.tsx`, `tests/components/LocaleSwitch.test.tsx`

- [ ] **Step 1: Write the failing test**

`tests/components/LocaleSwitch.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleSwitch } from "@/components/ui/LocaleSwitch";

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "/"} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => "/cursos",
  routing: { locales: ["es", "en"] },
}));

describe("LocaleSwitch", () => {
  it("renders both ES and EN options", () => {
    render(<LocaleSwitch currentLocale="es" />);
    expect(screen.getByRole("link", { name: "ES" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "EN" })).toBeInTheDocument();
  });

  it("marks the current locale as active via aria-current", () => {
    render(<LocaleSwitch currentLocale="es" />);
    expect(screen.getByRole("link", { name: "ES" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "EN" })).not.toHaveAttribute("aria-current");
  });
});
```

- [ ] **Step 2: Run test (should fail)**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm test tests/components/LocaleSwitch.test.tsx
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/components/ui/LocaleSwitch.tsx`**

```tsx
"use client";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/cn";

type Locale = "es" | "en";

export function LocaleSwitch({
  currentLocale,
  className,
}: {
  currentLocale: Locale;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <div
      className={cn("bg-teal-deep/10 inline-flex items-center rounded-full p-1 text-sm", className)}
    >
      {(["es", "en"] as const).map((locale) => {
        const active = locale === currentLocale;
        return (
          <Link
            key={locale}
            href={pathname as never}
            locale={locale}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-full px-3 py-1 font-semibold tracking-wide uppercase transition-colors",
              active ? "bg-teal-deep text-chartreuse" : "text-teal-deep hover:bg-teal-deep/10",
            )}
          >
            {locale}
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test (should pass)**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm test tests/components/LocaleSwitch.test.tsx
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(ui): add LocaleSwitch with URL-equivalent locale swap

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 19 — UI primitive: Accordion (with test)

**Files:**

- Create: `src/components/ui/Accordion.tsx`, `tests/components/Accordion.test.tsx`

- [ ] **Step 1: Write failing test**

`tests/components/Accordion.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Accordion } from "@/components/ui/Accordion";

const items = [
  { q: "Question 1", a: "Answer 1" },
  { q: "Question 2", a: "Answer 2" },
];

describe("Accordion", () => {
  it("renders all questions", () => {
    render(<Accordion items={items} />);
    expect(screen.getByText("Question 1")).toBeInTheDocument();
    expect(screen.getByText("Question 2")).toBeInTheDocument();
  });

  it("hides answers by default", () => {
    render(<Accordion items={items} />);
    expect(screen.queryByText("Answer 1")).not.toBeVisible();
  });

  it("reveals an answer when its question is clicked", async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    await user.click(screen.getByText("Question 1"));
    expect(screen.getByText("Answer 1")).toBeVisible();
  });
});
```

- [ ] **Step 2: Run (FAIL)**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm test tests/components/Accordion.test.tsx
```

- [ ] **Step 3: Implement**

`src/components/ui/Accordion.tsx`:

```tsx
"use client";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";

type Item = { q: string; a: string };

export function Accordion({ items, className }: { items: Item[]; className?: string }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const id = useId();
  return (
    <ul className={cn("divide-teal-deep/10 divide-y", className)}>
      {items.map((item, idx) => {
        const open = openIdx === idx;
        const panelId = `${id}-panel-${idx}`;
        const btnId = `${id}-btn-${idx}`;
        return (
          <li key={idx}>
            <button
              id={btnId}
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenIdx(open ? null : idx)}
              className="font-heading text-teal-deep flex w-full items-center justify-between gap-4 py-5 text-left text-lg font-semibold"
            >
              <span>{item.q}</span>
              <span aria-hidden className={cn("transition-transform", open && "rotate-45")}>
                +
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              hidden={!open}
              className="pb-5 text-base text-gray-900"
            >
              {item.a}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 4: Run (PASS)**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm test tests/components/Accordion.test.tsx
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(ui): add Accordion with accessible disclosure pattern

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 20 — UI primitive: FormField (with test)

**Files:**

- Create: `src/components/ui/FormField.tsx`, `tests/components/FormField.test.tsx`

- [ ] **Step 1: Failing test**

`tests/components/FormField.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormField } from "@/components/ui/FormField";

describe("FormField", () => {
  it("renders label associated with input", () => {
    render(<FormField label="Email" name="email" type="email" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("name", "email");
  });
  it("shows an error message when provided", () => {
    render(<FormField label="Email" name="email" error="Required" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });
});
```

- [ ] **Step 2: Run (FAIL).**

- [ ] **Step 3: Implement**

`src/components/ui/FormField.tsx`:

```tsx
import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CommonProps = {
  label: string;
  name: string;
  error?: string;
  helperText?: string;
  className?: string;
};

type InputProps = CommonProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "name"> & {
    as?: "input";
  };

type TextareaProps = CommonProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name"> & {
    as: "textarea";
  };

type Props = InputProps | TextareaProps;

export function FormField(props: Props) {
  const { label, name, error, helperText, className, as = "input", ...rest } = props as any;
  const id = useId();
  const errId = `${id}-err`;
  const inputClasses = cn(
    "block w-full rounded-md border-2 px-3 py-2 text-base text-gray-900",
    "focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-0",
    error ? "border-red-600" : "border-teal-deep/30",
    className,
  );
  return (
    <div>
      <label htmlFor={id} className="text-teal-deep mb-1 block text-sm font-semibold">
        {label}
      </label>
      {as === "textarea" ? (
        <textarea
          id={id}
          name={name}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          className={inputClasses}
          rows={5}
          {...rest}
        />
      ) : (
        <input
          id={id}
          name={name}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          className={inputClasses}
          {...rest}
        />
      )}
      {helperText && !error && <p className="mt-1 text-xs text-gray-700">{helperText}</p>}
      {error && (
        <p id={errId} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run (PASS).**

- [ ] **Step 5: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(ui): add FormField with a11y label + error support

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 21 — Logo SVG components

**Files:**

- Create: `src/components/brand/LogoShield.tsx`, `LogoShieldInverse.tsx`, `LogoFull.tsx`, `LogoFullInverse.tsx`, `Wordmark.tsx`, `Pattern.tsx`, `index.ts`

> **Asset note:** the SVG geometry below is a faithful placeholder of the SCCA shield/mortar shape — a rounded-corner shield with a mortar+pestle silhouette inside. If you want a pixel-exact re-trace, open `brand/source/SC Compounding Academy.pdf` in Illustrator/Inkscape, export the shield as SVG, and replace the `<path>` content. The component API stays identical.

- [ ] **Step 1: `LogoShield.tsx`**

```tsx
import { cn } from "@/lib/cn";

export function LogoShield({
  className,
  title = "SCCA shield",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 110"
      role="img"
      aria-label={title}
      className={cn("block", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <rect x="0" y="0" width="100" height="110" rx="22" fill="currentColor" />
      {/* mortar bowl */}
      <path d="M28 62 Q50 92 72 62 Z" fill="var(--color-chartreuse)" />
      {/* mortar rim */}
      <rect x="26" y="56" width="48" height="8" rx="4" fill="var(--color-chartreuse)" />
      {/* pestle */}
      <rect
        x="56"
        y="22"
        width="8"
        height="42"
        rx="4"
        transform="rotate(20 60 43)"
        fill="var(--color-chartreuse)"
      />
    </svg>
  );
}
```

- [ ] **Step 2: `LogoShieldInverse.tsx`**

```tsx
import { cn } from "@/lib/cn";

export function LogoShieldInverse({
  className,
  title = "SCCA shield (inverse)",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 110"
      role="img"
      aria-label={title}
      className={cn("block", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <rect x="0" y="0" width="100" height="110" rx="22" fill="var(--color-chartreuse)" />
      <path d="M28 62 Q50 92 72 62 Z" fill="var(--color-teal-deep)" />
      <rect x="26" y="56" width="48" height="8" rx="4" fill="var(--color-teal-deep)" />
      <rect
        x="56"
        y="22"
        width="8"
        height="42"
        rx="4"
        transform="rotate(20 60 43)"
        fill="var(--color-teal-deep)"
      />
    </svg>
  );
}
```

- [ ] **Step 3: `LogoFull.tsx`** (horizontal lockup, dark-bg version)

```tsx
import { LogoShield } from "./LogoShield";
import { cn } from "@/lib/cn";

export function LogoFull({
  className,
  shieldClass,
  title = "Santa Cruz Compounding Academy",
}: {
  className?: string;
  shieldClass?: string;
  title?: string;
}) {
  return (
    <div
      className={cn("text-chartreuse inline-flex items-center gap-3", className)}
      aria-label={title}
      role="img"
    >
      <LogoShield className={cn("h-12 w-auto", shieldClass)} title="" />
      <span className="font-heading leading-none">
        <span className="text-off-white block text-xs font-medium">Santa Cruz</span>
        <span className="text-off-white block text-xl font-bold">Compounding</span>
        <span className="text-off-white block text-xl font-bold">Academy</span>
      </span>
    </div>
  );
}
```

- [ ] **Step 4: `LogoFullInverse.tsx`** (light-bg version)

```tsx
import { LogoShield } from "./LogoShield";
import { cn } from "@/lib/cn";

export function LogoFullInverse({
  className,
  shieldClass,
  title = "Santa Cruz Compounding Academy",
}: {
  className?: string;
  shieldClass?: string;
  title?: string;
}) {
  return (
    <div
      className={cn("text-teal-deep inline-flex items-center gap-3", className)}
      aria-label={title}
      role="img"
    >
      <LogoShield className={cn("h-12 w-auto", shieldClass)} title="" />
      <span className="font-heading leading-none">
        <span className="block text-xs font-medium">Santa Cruz</span>
        <span className="block text-xl font-bold">Compounding</span>
        <span className="block text-xl font-bold">Academy</span>
      </span>
    </div>
  );
}
```

- [ ] **Step 5: `Wordmark.tsx`**

```tsx
import { cn } from "@/lib/cn";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-heading font-bold tracking-tight", className)}>
      Santa Cruz Compounding Academy
    </span>
  );
}
```

- [ ] **Step 6: `Pattern.tsx`** (tiled monogram)

```tsx
import { cn } from "@/lib/cn";

export function Pattern({ className, opacity = 0.12 }: { className?: string; opacity?: number }) {
  const id = "scca-pattern";
  return (
    <svg
      aria-hidden
      className={cn("absolute inset-0 h-full w-full", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={id} width="80" height="90" patternUnits="userSpaceOnUse">
          <g fill="var(--color-teal-deep)" opacity={opacity}>
            <rect x="6" y="6" width="32" height="36" rx="6" />
            <rect x="44" y="46" width="30" height="14" rx="4" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
```

- [ ] **Step 7: `index.ts`**

```ts
export { LogoShield } from "./LogoShield";
export { LogoShieldInverse } from "./LogoShieldInverse";
export { LogoFull } from "./LogoFull";
export { LogoFullInverse } from "./LogoFullInverse";
export { Wordmark } from "./Wordmark";
export { Pattern } from "./Pattern";
```

- [ ] **Step 8: Lint + typecheck**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm typecheck && pnpm exec eslint src/components/brand
```

Expected: zero errors. (No hex literals — uses `var(--color-*)`.)

- [ ] **Step 9: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(brand): add logo SVG components and tiled pattern

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 22 — Header

**Files:**

- Create: `src/components/layout/Header.tsx`

- [ ] **Step 1: Create**

```tsx
"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { LogoFull } from "@/components/brand";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { LocaleSwitch } from "@/components/ui/LocaleSwitch";

export function Header({ locale }: { locale: "es" | "en" }) {
  const t = useTranslations("nav");
  return (
    <header className="bg-teal-deep/95 supports-[backdrop-filter]:bg-teal-deep/80 sticky top-0 z-50 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center">
          <LogoFull shieldClass="h-9 w-auto" />
        </Link>
        <nav className="text-off-white hidden items-center gap-6 text-sm font-semibold sm:flex">
          <Link href="/" className="hover:text-chartreuse">
            {t("home")}
          </Link>
          <Link href="/cursos" className="hover:text-chartreuse">
            {t("courses")}
          </Link>
          <Link href="/contacto" className="hover:text-chartreuse">
            {t("contact")}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LocaleSwitch currentLocale={locale} />
          <Link href="/cursos">
            <Button variant="primary" size="md">
              {t("enroll")}
            </Button>
          </Link>
        </div>
      </Container>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(layout): add sticky brand Header

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 23 — Footer

**Files:**

- Create: `src/components/layout/Footer.tsx`

- [ ] **Step 1: Create**

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { LogoFull } from "@/components/brand";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();
  return (
    <footer className="bg-teal-deep text-off-white">
      <Container className="grid gap-10 py-12 sm:grid-cols-3">
        <div>
          <LogoFull shieldClass="h-12 w-auto" />
          <p className="text-chartreuse mt-4 max-w-xs text-sm italic">{t("tagline")}</p>
        </div>
        <div>
          <h3 className="font-heading text-chartreuse text-sm font-bold tracking-wide uppercase">
            {t("legal")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/legal/privacidad" className="hover:text-chartreuse">
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link href="/legal/terminos" className="hover:text-chartreuse">
                {t("terms")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-heading text-chartreuse text-sm font-bold tracking-wide uppercase">
            {t("contact")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/contacto" className="hover:text-chartreuse">
                {t("contact")}
              </Link>
            </li>
          </ul>
        </div>
      </Container>
      <div className="bg-teal-deep/90 text-off-white/80 py-4 text-center text-xs">
        {t("copyright", { year })}
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(layout): add Footer

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 24 — Wire Header + Footer into the locale layout

**Files:**

- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Replace contents**

```tsx
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "es" | "en")) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <Header locale={locale as "es" | "en"} />
      <main id="content">{children}</main>
      <Footer />
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 2: Visual check**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm dev
```

Visit `/es` — header, hero placeholder, footer should all render. Locale switch should work. Kill server.

- [ ] **Step 3: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(layout): mount Header + Footer in locale layout

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 25 — Marketing section: TaglineBand

**Files:**

- Create: `src/components/marketing/TaglineBand.tsx`

- [ ] **Step 1: Create**

```tsx
import { useTranslations } from "next-intl";

export function TaglineBand() {
  const t = useTranslations("tagline");
  return (
    <section aria-label="tagline" className="bg-teal-deep py-12 sm:py-16">
      <p className="font-heading text-chartreuse mx-auto max-w-6xl px-6 text-center text-4xl leading-tight font-extrabold tracking-tight uppercase sm:text-6xl lg:text-7xl">
        {t("line1")} <em className="font-accent italic">{t("line2")}</em>
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(marketing): add TaglineBand

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 26 — Marketing section: HeroBillboard (without mortar slot yet)

**Files:**

- Create: `src/components/marketing/HeroBillboard.tsx`, `src/components/marketing/HeroMortarSlot.tsx`

- [ ] **Step 1: Create `HeroMortarSlot.tsx`** (placeholder; real component arrives in Task 35)

```tsx
export function HeroMortarSlot() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 opacity-30 select-none sm:block"
    >
      <div className="bg-chartreuse/20 h-full w-full rounded-full blur-3xl" />
    </div>
  );
}
```

- [ ] **Step 2: Create `HeroBillboard.tsx`**

```tsx
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { HeroMortarSlot } from "./HeroMortarSlot";

export function HeroBillboard() {
  const t = useTranslations("hero");
  return (
    <section className="bg-teal-deep relative isolate overflow-hidden">
      <HeroMortarSlot />
      <Container className="relative grid items-center gap-10 py-20 sm:py-28 lg:grid-cols-2">
        <div>
          <Badge tone="chartreuse">USP 795 · USP 800</Badge>
          <h1 className="font-heading text-chartreuse mt-4 text-5xl leading-[1.05] font-extrabold tracking-tight uppercase sm:text-6xl lg:text-7xl">
            {t("headline")}
          </h1>
          <p className="text-off-white mt-6 max-w-lg text-lg">{t("subhead")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cursos">
              <Button variant="primary" size="lg">
                {t("primaryCta")}
              </Button>
            </Link>
            <Link href="/contacto">
              <Button variant="inverse" size="lg">
                {t("secondaryCta")}
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative hidden h-[440px] lg:block">
          <Image
            src="/hero/pharmacist-placeholder.webp"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 0px, 50vw"
            className="object-contain"
          />
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 3: Add a tiny placeholder image**

We need a `public/hero/pharmacist-placeholder.webp`. Generate one with Sharp:

Create `scripts/make-placeholders.mjs`:

```js
import sharp from "sharp";
import fs from "node:fs/promises";

await fs.mkdir("public/hero", { recursive: true });

// Pharmacist silhouette placeholder: simple SVG rendered to WebP
const svg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">
  <rect width="600" height="800" fill="#225560"/>
  <circle cx="300" cy="300" r="120" fill="#E9EA8A"/>
  <rect x="200" y="420" width="200" height="320" rx="40" fill="#F5F6F7"/>
</svg>
`);
await sharp(svg).webp({ quality: 80 }).toFile("public/hero/pharmacist-placeholder.webp");

// Mortar poster (mid-grind)
const mortarSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="rgba(0,0,0,0)"/>
  <ellipse cx="400" cy="540" rx="220" ry="60" fill="#F1ECE2" opacity="0.9"/>
  <path d="M180 460 Q400 700 620 460 Z" fill="#F1ECE2"/>
  <rect x="380" y="220" width="40" height="320" rx="18" transform="rotate(15 400 380)" fill="#EAE6DC"/>
</svg>
`);
await sharp(mortarSvg).webp({ quality: 80 }).toFile("public/hero/mortar-poster.webp");
console.log("Placeholders written.");
```

Add to `package.json` scripts:

```json
"build:placeholders": "node scripts/make-placeholders.mjs"
```

Then run:

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm build:placeholders
```

- [ ] **Step 4: Visual check**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm dev
```

Hero should show on `/es` and `/en`. Kill server.

- [ ] **Step 5: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(marketing): add HeroBillboard + placeholder assets

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 27 — Marketing section: WhySCCA

**Files:**

- Create: `src/components/marketing/WhySCCA.tsx`

- [ ] **Step 1: Create**

```tsx
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { SectionBand } from "@/components/ui/SectionBand";

const KEYS = ["instructor", "cohorts", "usp", "certification"] as const;

const ICONS: Record<(typeof KEYS)[number], string> = {
  instructor: "M5 13l4 4L19 7",
  cohorts: "M17 20h5V10M9 20H4v-6m13-4V4H7v6",
  usp: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  certification: "M12 14l9-5-9-5-9 5 9 5zm0 7v-7",
};

export function WhySCCA() {
  const t = useTranslations("whySCCA");
  return (
    <SectionBand tone="sand" id="why">
      <Container>
        <Heading as="h2" size="h2" className="text-teal-deep">
          {t("title")}
        </Heading>
        <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {KEYS.map((k) => (
            <li key={k} className="flex flex-col gap-3">
              <span className="bg-chartreuse inline-flex h-12 w-12 items-center justify-center rounded-2xl">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="var(--color-teal-deep)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={ICONS[k]} />
                </svg>
              </span>
              <h3 className="font-heading text-teal-deep text-lg font-bold">
                {t(`items.${k}.title`)}
              </h3>
              <p className="text-base text-gray-900">{t(`items.${k}.body`)}</p>
            </li>
          ))}
        </ul>
      </Container>
    </SectionBand>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(marketing): add WhySCCA value-props section

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 28 — Marketing section: FeaturedCoursesPlaceholder

**Files:**

- Create: `src/components/marketing/FeaturedCoursesPlaceholder.tsx`

- [ ] **Step 1: Create**

```tsx
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionBand } from "@/components/ui/SectionBand";
import { Link } from "@/i18n/routing";

const PLACEHOLDER_COURSES = [
  {
    id: "usp-795",
    badge: "USP 795",
    titleEs: "Fundamentos de Compounding No Estéril",
    titleEn: "Non-Sterile Compounding Foundations",
  },
  {
    id: "usp-800",
    badge: "USP 800",
    titleEs: "Manejo de Medicamentos Peligrosos",
    titleEn: "Hazardous Drug Handling",
  },
  {
    id: "combined",
    badge: "USP 795 + 800",
    titleEs: "Programa Combinado",
    titleEn: "Combined Track",
  },
] as const;

export function FeaturedCoursesPlaceholder({ locale }: { locale: "es" | "en" }) {
  const t = useTranslations("featured");
  return (
    <SectionBand tone="off-white" id="featured">
      <Container>
        <div className="flex items-end justify-between">
          <Heading as="h2" size="h2" className="text-teal-deep">
            {t("title")}
          </Heading>
          <Link
            href="/cursos"
            className="font-heading text-teal-deep hover:text-teal hidden text-sm font-semibold sm:inline"
          >
            {t("viewAll")} →
          </Link>
        </div>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {PLACEHOLDER_COURSES.map((c) => (
            <li key={c.id}>
              <Card tone="white" className="h-full">
                <Badge tone="chartreuse">{c.badge}</Badge>
                <h3 className="font-heading text-teal-deep mt-4 text-xl font-bold">
                  {locale === "es" ? c.titleEs : c.titleEn}
                </h3>
                <p className="mt-3 text-sm text-gray-700">{t("comingSoon")}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </SectionBand>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(marketing): add FeaturedCoursesPlaceholder section

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 29 — Marketing section: InstructorSection

**Files:**

- Create: `src/components/marketing/InstructorSection.tsx`

- [ ] **Step 1: Create**

```tsx
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { SectionBand } from "@/components/ui/SectionBand";

export function InstructorSection() {
  const t = useTranslations("instructor");
  return (
    <SectionBand tone="teal-deep" id="instructor">
      <Container className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="bg-teal aspect-[4/5] w-full rounded-2xl" aria-hidden />
        </div>
        <div className="lg:col-span-3">
          <Heading as="h2" size="h2" className="text-chartreuse">
            {t("title")}
          </Heading>
          <p className="text-off-white mt-6 max-w-2xl text-lg">{t("bioPlaceholder")}</p>
        </div>
      </Container>
    </SectionBand>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(marketing): add InstructorSection (placeholder portrait)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 30 — Marketing section: PatternDivider

**Files:**

- Create: `src/components/marketing/PatternDivider.tsx`

- [ ] **Step 1: Create**

```tsx
import { Pattern } from "@/components/brand";

export function PatternDivider() {
  return (
    <div className="bg-teal relative h-32 w-full overflow-hidden">
      <Pattern opacity={0.18} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(marketing): add PatternDivider

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 31 — Marketing section: FAQ

**Files:**

- Create: `src/components/marketing/FAQ.tsx`

- [ ] **Step 1: Create**

```tsx
"use client";
import { useTranslations, useMessages } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { SectionBand } from "@/components/ui/SectionBand";
import { Accordion } from "@/components/ui/Accordion";

export function FAQ() {
  const t = useTranslations("faq");
  const messages = useMessages() as unknown as { faq: { items: { q: string; a: string }[] } };
  const items = messages.faq.items;
  return (
    <SectionBand tone="off-white" id="faq">
      <Container className="max-w-3xl">
        <Heading as="h2" size="h2" className="text-teal-deep">
          {t("title")}
        </Heading>
        <div className="mt-8">
          <Accordion items={items} />
        </div>
      </Container>
    </SectionBand>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(marketing): add FAQ accordion section

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 32 — Marketing section: FooterCTA

**Files:**

- Create: `src/components/marketing/FooterCTA.tsx`

- [ ] **Step 1: Create**

```tsx
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";
import { SectionBand } from "@/components/ui/SectionBand";
import { Link } from "@/i18n/routing";

export function FooterCTA() {
  const t = useTranslations("footerCta");
  return (
    <SectionBand tone="sand">
      <Container className="text-center">
        <Heading as="h2" size="h2" className="text-teal-deep">
          {t("headline")}
        </Heading>
        <p className="mx-auto mt-4 max-w-xl text-lg text-gray-900">{t("subhead")}</p>
        <div className="mt-8">
          <Link href="/cursos">
            <Button variant="primary" size="lg">
              {t("button")}
            </Button>
          </Link>
        </div>
      </Container>
    </SectionBand>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(marketing): add FooterCTA band

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 33 — Compose the landing page

**Files:**

- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 1: Replace contents**

```tsx
import { setRequestLocale } from "next-intl/server";
import { HeroBillboard } from "@/components/marketing/HeroBillboard";
import { TaglineBand } from "@/components/marketing/TaglineBand";
import { FeaturedCoursesPlaceholder } from "@/components/marketing/FeaturedCoursesPlaceholder";
import { WhySCCA } from "@/components/marketing/WhySCCA";
import { InstructorSection } from "@/components/marketing/InstructorSection";
import { PatternDivider } from "@/components/marketing/PatternDivider";
import { FAQ } from "@/components/marketing/FAQ";
import { FooterCTA } from "@/components/marketing/FooterCTA";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <HeroBillboard />
      <TaglineBand />
      <FeaturedCoursesPlaceholder locale={locale as "es" | "en"} />
      <WhySCCA />
      <PatternDivider />
      <InstructorSection />
      <FAQ />
      <PatternDivider />
      <FooterCTA />
    </>
  );
}
```

- [ ] **Step 2: Visual check**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm dev
```

Visit `/es` and `/en`. Scroll the whole page. Verify each section renders. Kill server.

- [ ] **Step 3: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(page): compose landing page from marketing sections

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 34 — Catalog placeholder, contact page, legal pages

**Files:**

- Create: `src/app/[locale]/cursos/page.tsx`, `src/app/[locale]/courses/page.tsx`, `src/app/[locale]/contacto/page.tsx`, `src/app/[locale]/contact/page.tsx`, `src/app/[locale]/legal/privacidad/page.tsx`, `src/app/[locale]/legal/privacy/page.tsx`, `src/app/[locale]/legal/terminos/page.tsx`, `src/app/[locale]/legal/terms/page.tsx`

> **Note:** because we use translated pathnames, each locale needs its own file at its specific slug. Files mirror each other and re-export a shared component.

- [ ] **Step 1: Create the shared catalog placeholder component**

`src/components/marketing/CatalogPlaceholder.tsx`:

```tsx
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { SectionBand } from "@/components/ui/SectionBand";

export function CatalogPlaceholder() {
  const t = useTranslations("courses");
  return (
    <SectionBand tone="off-white">
      <Container>
        <Heading as="h1" size="h1" className="text-teal-deep">
          {t("title")}
        </Heading>
        <p className="mt-4 max-w-2xl text-lg text-gray-900">{t("comingSoonNotice")}</p>
      </Container>
    </SectionBand>
  );
}
```

- [ ] **Step 2: Create the route files**

Each of these has identical contents — they exist purely so the translated paths resolve:

```tsx
// src/app/[locale]/cursos/page.tsx
import { setRequestLocale } from "next-intl/server";
import { CatalogPlaceholder } from "@/components/marketing/CatalogPlaceholder";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CatalogPlaceholder />;
}
```

Copy this exact content into:

- `src/app/[locale]/cursos/page.tsx`
- `src/app/[locale]/courses/page.tsx`

For legal pages, create a shared component:

`src/components/marketing/LegalPage.tsx`:

```tsx
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { SectionBand } from "@/components/ui/SectionBand";

export function LegalPage({ doc }: { doc: "privacy" | "terms" }) {
  const t = useTranslations(`legal.${doc}`);
  return (
    <SectionBand tone="off-white">
      <Container className="max-w-3xl">
        <Heading as="h1" size="h1" className="text-teal-deep">
          {t("title")}
        </Heading>
        <p className="mt-6 text-base text-gray-900">{t("body")}</p>
      </Container>
    </SectionBand>
  );
}
```

Then create four route files, each one line of useful content:

```tsx
// src/app/[locale]/legal/privacidad/page.tsx (and /privacy/page.tsx)
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/marketing/LegalPage";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage doc="privacy" />;
}
```

```tsx
// src/app/[locale]/legal/terminos/page.tsx (and /terms/page.tsx)
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/marketing/LegalPage";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage doc="terms" />;
}
```

- [ ] **Step 3: Smoke-check the routes**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm dev
```

Visit:

- `/es/cursos` and `/en/courses` — catalog placeholder
- `/es/legal/privacidad` and `/en/legal/privacy`
- `/es/legal/terminos` and `/en/legal/terms`

All should render with header + footer. Kill server.

- [ ] **Step 4: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(pages): add catalog placeholder + legal pages

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 35 — Contact page + Resend-backed API route

**Files:**

- Create: `src/components/marketing/ContactForm.tsx`, `src/app/[locale]/contacto/page.tsx`, `src/app/[locale]/contact/page.tsx`, `src/app/api/contact/route.ts`, `.env.example`

- [ ] **Step 1: Add env keys to `.env.example`**

```
# Resend API key — sign up at https://resend.com → API Keys
RESEND_API_KEY=

# Email address that receives contact-form submissions
CONTACT_INBOX_EMAIL=contact@sccompoundingacademy.com

# From-address used for outbound mail (must be a verified Resend domain)
CONTACT_FROM_EMAIL=hello@sccompoundingacademy.com
```

- [ ] **Step 2: Create `ContactForm.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { SectionBand } from "@/components/ui/SectionBand";

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const t = useTranslations("contact");
  const locale = useLocale();
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      subject: form.get("subject"),
      message: form.get("message"),
      locale,
    };
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setStatus(res.ok ? "success" : "error");
    if (res.ok) (e.target as HTMLFormElement).reset();
  }

  return (
    <SectionBand tone="off-white">
      <Container className="max-w-2xl">
        <Heading as="h1" size="h1" className="text-teal-deep">
          {t("title")}
        </Heading>
        <p className="mt-3 text-lg text-gray-900">{t("subhead")}</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <FormField label={t("name")} name="name" required />
          <FormField label={t("email")} name="email" type="email" required />
          <FormField label={t("phone")} name="phone" type="tel" />
          <FormField label={t("subject")} name="subject" />
          <FormField as="textarea" label={t("message")} name="message" required />
          <Button type="submit" variant="primary" size="lg" disabled={status === "submitting"}>
            {status === "submitting" ? t("submitting") : t("submit")}
          </Button>
          {status === "success" && <p className="text-teal-deep">{t("success")}</p>}
          {status === "error" && <p className="text-red-700">{t("error")}</p>}
        </form>
      </Container>
    </SectionBand>
  );
}
```

- [ ] **Step 3: Create the page route files**

```tsx
// src/app/[locale]/contacto/page.tsx (and /contact/page.tsx)
import { setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/marketing/ContactForm";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContactForm />;
}
```

Copy identical content into both `contacto/page.tsx` and `contact/page.tsx`.

- [ ] **Step 4: Create the API route `src/app/api/contact/route.ts`**

```ts
import { z } from "zod";
import { Resend } from "resend";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  phone: z.string().max(40).optional().nullable(),
  subject: z.string().max(200).optional().nullable(),
  message: z.string().min(1).max(5000),
  locale: z.enum(["es", "en"]),
});

// in-memory token bucket (per process, per IP) — fine for low-traffic launch
const RATE: Map<string, { count: number; resetAt: number }> = new Map();
const WINDOW_MS = 60_000;
const LIMIT = 5;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = RATE.get(ip);
  if (!entry || entry.resetAt < now) {
    RATE.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > LIMIT;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid", issues: parsed.error.flatten() }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const inbox = process.env.CONTACT_INBOX_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !inbox || !from) {
    return Response.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  const { name, email, phone, subject, message, locale } = parsed.data;
  const subjectLine = subject?.trim() || `Contacto (${locale.toUpperCase()}) — ${name}`;
  const html = `
    <h2>Nueva consulta / New inquiry</h2>
    <p><strong>Nombre / Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    ${phone ? `<p><strong>Teléfono:</strong> ${escapeHtml(phone)}</p>` : ""}
    <p><strong>Locale:</strong> ${locale}</p>
    <hr/>
    <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
  `;

  const { error } = await resend.emails.send({
    from,
    to: inbox,
    replyTo: email,
    subject: subjectLine,
    html,
  });
  if (error) return Response.json({ error: "send_failed" }, { status: 502 });

  return Response.json({ ok: true });
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
```

- [ ] **Step 5: Smoke-check the form UI** (without sending real email)

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm dev
```

Visit `/es/contacto` and `/en/contact`. Submit the form — expect an error toast (because env vars aren't set yet). UI behavior is correct. Kill server.

- [ ] **Step 6: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(contact): add contact form + Resend-backed API route

- Validates with zod
- Per-IP rate limit (5/min)
- Returns clean error codes for client feedback

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 36 — E2E: contact form happy path

**Files:**

- Create: `tests/e2e/contact-form.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from "@playwright/test";

test("contact form renders and validates required fields", async ({ page }) => {
  await page.goto("/es/contacto");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Contáctanos");
  // Required fields enforced by the browser; native validation prevents submit.
  await page.getByRole("button", { name: "Enviar mensaje" }).click();
  const name = page.getByLabel("Nombre");
  await expect(name).toBeFocused();
});

test("contact form shows error toast when API misconfigured", async ({ page }) => {
  await page.goto("/en/contact");
  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Message").fill("Hello.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Something went wrong.")).toBeVisible({ timeout: 5000 });
});
```

- [ ] **Step 2: Run**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm test:e2e tests/e2e/contact-form.spec.ts
```

Expected: 2 tests pass.

- [ ] **Step 3: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "test(e2e): contact form validation + error path

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 37 — Blender mortar — manual asset production

**Files:**

- Create: `blender/README.md`, `blender/mortar.blend` (binary, manually produced)

> **This task is manual creative work in Blender, not code.** Follow these steps in Blender; commit the `.blend` file at the end. If you skip this task, the placeholder mortar-poster.webp keeps the site working (no broken images), but the scroll-driven animation will simply show the static poster.

- [ ] **Step 1: Open Blender 4.x, new General scene; delete the default cube**

- [ ] **Step 2: Model the mortar** (~15 min)

- Add → Mesh → Cylinder (32 vertices, radius 1, depth 0.5). Move up so it sits on origin.
- Tab into Edit Mode; select top face → Inset (I) by 0.1 → Extrude (E) down to model the bowl interior.
- Select bottom face → Inset (I) by 0.1 → Extrude (E) downward 0.1 to make a foot.
- Object Mode → add Subdivision Surface modifier (level 2) and Bevel modifier (Amount 0.02, Segments 3).
- Shade Smooth (right-click).
- Rename to `Mortar`.

- [ ] **Step 3: Model the pestle** (~10 min)

- Add → Mesh → Cylinder (radius 0.08, depth 1.2). Place it leaning into the bowl at ~30°.
- Edit Mode → select bottom edge loop → Scale up slightly (1.4×) to form the rounded grinding tip.
- Add a Subdivision Surface modifier (level 2) and Bevel (Amount 0.01, Segments 2).
- Shade Smooth. Rename to `Pestle`.

- [ ] **Step 4: Materials** (~5 min)

- Create material `MortarBody`:
  - Base Color: `#F1ECE2` (paste hex into color picker)
  - Roughness: 0.32
  - Specular: 0.55
  - Clearcoat: 0.25, Clearcoat Roughness: 0.15
- Assign to Mortar.
- Create material `PestleBody`:
  - Base Color: `#EAE6DC` ; everything else identical to MortarBody.
- Assign to Pestle.

- [ ] **Step 5: Lighting** (~10 min)

- Delete the default light.
- Add → Light → Area, position upper-front-right at (2, -2, 3), rotated 45° down. Color: pure white. Strength 700. Name: `Key`.
- Add Area light at (-2, -2, 1), color slightly cool (`#F0F8FF`), Strength 250. Name: `Fill`.
- Add Spot light at (-1.5, 2, 2.5), color `#368798`, Strength 900. Name: `RimTeal`.
- Add Spot light at (1.5, 2, 2.5), color `#E9EA8A`, Strength 400. Name: `RimChartreuse`.
- Add Area light below at (0, 0, -1), facing up, Strength 60 (for ambient contact). Name: `ContactFill`.

- [ ] **Step 6: Camera** (~3 min)

- Move the default camera to (0, -4, 1.6), aim it at the mortar. Lock it in place.
- World background: transparent (Properties → Render → Film → Transparent: ON).

- [ ] **Step 7: Animation** (~15 min) — pestle grinds inside the bowl

- Select Pestle. With timeline at frame 1, insert a Location + Rotation keyframe (`I` → Location & Rotation).
- At frame 24: rotate pestle tip 90° around the bowl center (you can parent it to an Empty at the bowl center and rotate the Empty around Z to make this trivial). Insert keyframe.
- At frame 48: 180°. Frame 72: 270°. Frame 96: 360°. Insert keyframes.
- Set Z-rotation interpolation to Linear (Graph Editor → select keyframes → T → Linear).
- Add subtle 8° lean: each quarter-rotation, vary X-rotation between -8° and +8°. Eased Bezier interpolation.
- Add subtle 2mm vertical bob: Z-location +0.002 twice per orbit. Eased Bezier.
- Playback should show a continuous grinding motion.

- [ ] **Step 8: Render settings** (~3 min)

- Properties → Render Engine: **Eevee**.
- Render → Sampling: 64 (render) / 16 (viewport).
- Render → Output: Resolution 1600×1600. Frame Range Start 1, End 80. Frame rate 24fps.
- Output path: `//renders/frame_####.png`. Format: PNG, RGBA, 8-bit.
- Render → Render Animation (Ctrl-F12). Should complete in 10–20 minutes.

- [ ] **Step 9: Save the .blend**

File → Save As → `blender/mortar.blend`.

- [ ] **Step 10: Write `blender/README.md`**

````markdown
# Mortar 3D Asset

The scroll-driven hero mortar is rendered once from `mortar.blend` and exported as 80 WebP frames into `/public/hero/mortar/`.

## Re-render workflow

1. Open `blender/mortar.blend` in Blender 4.x.
2. Tweak the scene as needed (lighting, animation timing, materials).
3. **Render → Render Animation** (Ctrl-F12). Output goes to `blender/renders/frame_####.png` (80 frames).
4. Run the conversion pipeline:

   ```bash
   pnpm build:mortar
   ```
````

5. Confirm output: `public/hero/mortar/frame_0001.webp` through `frame_0080.webp` + `manifest.json`.
6. `git add public/hero/mortar/manifest.json && git commit -m "feat(hero): re-render mortar frames"`. WebP frames themselves are gitignored.

## Scene reference

- Mortar material: #F1ECE2 ceramic, roughness 0.32, clearcoat 0.25
- Pestle material: #EAE6DC ceramic, same shader
- Lights: Key (warm white, 700W), Fill (cool white, 250W), Rim Teal #368798 (900W), Rim Chartreuse #E9EA8A (400W)
- Animation: pestle orbits bowl center, linear Z-rotation, eased X-lean and Z-bob
- Output: 1600×1600 PNG with alpha, 80 frames at 24fps

````

- [ ] **Step 11: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add blender/ && git commit -m "feat(hero): add Blender mortar source + render instructions

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
````

---

## Task 38 — Frame conversion pipeline (PNG → WebP + manifest)

**Files:**

- Create: `scripts/build-mortar-frames.mjs`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Create `scripts/build-mortar-frames.mjs`**

```js
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "blender/renders";
const DST = "public/hero/mortar";
const QUALITY = 78;
const TARGET_FRAMES = 80;

await fs.mkdir(DST, { recursive: true });

let files;
try {
  files = (await fs.readdir(SRC)).filter((f) => /^frame_\d+\.png$/.test(f)).sort();
} catch {
  console.error(`No renders found at ${SRC}. Render in Blender first (Ctrl-F12).`);
  process.exit(1);
}

if (files.length === 0) {
  console.error(`No PNG frames in ${SRC}.`);
  process.exit(1);
}

// Resample to exactly TARGET_FRAMES frames (in case Blender outputs more/fewer)
const step = files.length / TARGET_FRAMES;
const picked = Array.from({ length: TARGET_FRAMES }, (_, i) => files[Math.floor(i * step)]);

const manifest = { frameCount: TARGET_FRAMES, width: 1600, height: 1600, frames: [] };
for (let i = 0; i < picked.length; i++) {
  const inFile = path.join(SRC, picked[i]);
  const outName = `frame_${String(i + 1).padStart(4, "0")}.webp`;
  const outFile = path.join(DST, outName);
  await sharp(inFile).webp({ quality: QUALITY }).toFile(outFile);
  manifest.frames.push(`/hero/mortar/${outName}`);
  process.stdout.write(`\r${i + 1}/${TARGET_FRAMES}`);
}
process.stdout.write("\n");
await fs.writeFile(path.join(DST, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Wrote ${TARGET_FRAMES} WebP frames + manifest.json`);
```

- [ ] **Step 2: Add to `package.json` scripts**

```json
"build:mortar": "node scripts/build-mortar-frames.mjs"
```

- [ ] **Step 3: Run if you have rendered frames** (skip if you haven't)

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm build:mortar
```

Expected: `public/hero/mortar/frame_0001.webp` … `frame_0080.webp` + `manifest.json`.

If you don't have renders yet, **create a stub manifest manually** so the rest of the build works:

```bash
cat > public/hero/mortar/manifest.json <<'JSON'
{
  "frameCount": 1,
  "width": 1600,
  "height": 1600,
  "frames": ["/hero/mortar-poster.webp"]
}
JSON
```

- [ ] **Step 4: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add scripts/build-mortar-frames.mjs package.json public/hero/mortar/manifest.json && git commit -m "feat(hero): add PNG→WebP build pipeline + manifest

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 39 — HeroMortar React component (scroll-scrub)

**Files:**

- Create: `src/components/marketing/HeroMortar.tsx`
- Modify: `src/components/marketing/HeroBillboard.tsx` (replace HeroMortarSlot)
- Delete: `src/components/marketing/HeroMortarSlot.tsx`

- [ ] **Step 1: Create `HeroMortar.tsx`**

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import manifest from "../../../public/hero/mortar/manifest.json";

type Manifest = { frameCount: number; width: number; height: number; frames: string[] };

const M = manifest as Manifest;

export function HeroMortar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const currentFrameRef = useRef(0);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0]));
  const inViewRef = useRef(false);

  // Respect prefers-reduced-motion: render frame in the middle and stop.
  const [reduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  // Progressive preload at scroll-progress 25/50/75% first, then fill.
  useEffect(() => {
    if (reduced) return;
    const order: number[] = [];
    const last = M.frameCount - 1;
    for (const pct of [0.25, 0.5, 0.75]) order.push(Math.round(pct * last));
    for (let i = 0; i < M.frameCount; i++) if (!order.includes(i)) order.push(i);
    let cancelled = false;
    (async () => {
      for (const idx of order) {
        if (cancelled) return;
        await preloadFrame(idx);
        setLoaded((prev) => {
          if (prev.has(idx)) return prev;
          const next = new Set(prev);
          next.add(idx);
          return next;
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reduced]);

  // IntersectionObserver: pause when hero leaves viewport.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      inViewRef.current = entry.isIntersecting;
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // rAF scroll-driven scrub.
  useEffect(() => {
    if (reduced) {
      const mid = Math.floor(M.frameCount / 2);
      if (imgRef.current && M.frames[mid]) imgRef.current.src = M.frames[mid];
      return;
    }
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!inViewRef.current) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight;
      // 0 when hero top hits viewport top; 1 when hero bottom leaves viewport top.
      const progress = Math.min(1, Math.max(0, (viewport - rect.top) / (viewport + rect.height)));
      const target = Math.min(
        M.frameCount - 1,
        Math.max(0, Math.floor(progress * (M.frameCount - 1))),
      );
      if (
        target !== currentFrameRef.current &&
        loaded.has(target) &&
        imgRef.current &&
        M.frames[target]
      ) {
        imgRef.current.src = M.frames[target];
        currentFrameRef.current = target;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [loaded, reduced]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 select-none sm:block"
    >
      <img
        ref={imgRef}
        src={M.frames[0]}
        alt=""
        aria-hidden
        width={M.width}
        height={M.height}
        decoding="async"
        fetchPriority="low"
        className="absolute inset-0 m-auto h-full w-full object-contain"
      />
    </div>
  );
}

function preloadFrame(idx: number): Promise<void> {
  return new Promise((resolve) => {
    const url = M.frames[idx];
    if (!url) return resolve();
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}
```

- [ ] **Step 2: Allow JSON import in `tsconfig.json`**

Confirm `tsconfig.json` already has `"resolveJsonModule": true` (it does from Task 3).

- [ ] **Step 3: Swap `HeroMortarSlot` for `HeroMortar` in `HeroBillboard.tsx`**

Replace the `import` of `HeroMortarSlot` and its usage:

```tsx
// Replace:
import { HeroMortarSlot } from "./HeroMortarSlot";
// ...
<HeroMortarSlot />;
```

with:

```tsx
import { HeroMortar } from "./HeroMortar";
// ...
<HeroMortar />;
```

- [ ] **Step 4: Delete the placeholder slot**

```bash
cd ~/Desktop/sccompoundingacademy-web && rm src/components/marketing/HeroMortarSlot.tsx
```

- [ ] **Step 5: Visual check**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm dev
```

Visit `/es`, scroll up and down on the hero. Mortar should track the scroll. (With the 1-frame stub manifest, the same frame stays put — that's expected until real frames are rendered.)

- [ ] **Step 6: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(hero): add HeroMortar scroll-scrub component

- Progressive preload (25/50/75% first)
- IntersectionObserver pauses rAF when offscreen
- prefers-reduced-motion → static mid-frame

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 40 — SEO metadata helpers

**Files:**

- Create: `src/lib/seo.ts`
- Modify: `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`

- [ ] **Step 1: Create `src/lib/seo.ts`**

```ts
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

type Args = {
  locale: "es" | "en";
  title: string;
  description: string;
  pathname: string;
  ogImage?: string;
};

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function pageMetadata({ locale, title, description, pathname, ogImage }: Args): Metadata {
  const url = `${BASE_URL}/${locale}${pathname === "/" ? "" : pathname}`;
  const altLocales = routing.locales.filter((l) => l !== locale);
  const og = ogImage ?? `/og-image-${locale}.png`;

  return {
    title,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        [...altLocales, locale].map((l) => [
          l,
          `${BASE_URL}/${l}${pathname === "/" ? "" : pathname}`,
        ]),
      ),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Santa Cruz Compounding Academy",
      images: [{ url: og, width: 1200, height: 630 }],
      locale: locale === "es" ? "es_PR" : "en_US",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  };
}
```

- [ ] **Step 2: Add `<html lang>` per-locale**

Modify `src/app/[locale]/layout.tsx` to wrap children in a fragment + set the lang via the root layout. Since Next.js doesn't let nested layouts set `<html>`, we instead set it client-side via a small effect — but a cleaner approach: convert the root layout to read locale from headers.

Actually simplest: keep the root `<html>` at default and set `lang` dynamically. Add to `src/app/[locale]/layout.tsx` just below `const messages = await getMessages();`:

```tsx
// Set the lang attribute via a small inline script (runs before hydration).
```

Better solution — move `<html>` into the locale layout. Replace the root `src/app/layout.tsx`:

```tsx
import "./globals.css";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

Then update `src/app/[locale]/layout.tsx`:

```tsx
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { heading, accent } from "@/app/fonts";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "es" | "en")) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html lang={locale} className={`${heading.variable} ${accent.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Header locale={locale as "es" | "en"} />
          <main id="content">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Add per-page metadata to the landing page**

Append to `src/app/[locale]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title =
    locale === "es"
      ? "Santa Cruz Compounding Academy — Certificación USP 795 y USP 800"
      : "Santa Cruz Compounding Academy — USP 795 & USP 800 Certification";
  const description =
    locale === "es"
      ? "Educamos para formar bienestar y salud. Cursos de compounding no estéril y manejo de medicamentos peligrosos."
      : "We educate to build wellness and health. Non-sterile compounding and hazardous drug handling certification.";
  return pageMetadata({ locale: locale as "es" | "en", title, description, pathname: "/" });
}
```

- [ ] **Step 4: Verify**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm dev
```

View source on `/es` and `/en`: `<html lang>` should be the active locale; `<title>`, OG tags, hreflang should all be present.

- [ ] **Step 5: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(seo): per-locale metadata, hreflang, OG tags

- Move <html> into locale layout for correct lang attribute
- Add pageMetadata helper with canonical + alternates

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 41 — sitemap.ts + robots.ts

**Files:**

- Create: `src/app/sitemap.ts`, `src/app/robots.ts`

- [ ] **Step 1: Create `src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const PATHS: Record<string, { es: string; en: string }> = {
  home: { es: "/es", en: "/en" },
  courses: { es: "/es/cursos", en: "/en/courses" },
  contact: { es: "/es/contacto", en: "/en/contact" },
  privacy: { es: "/es/legal/privacidad", en: "/en/legal/privacy" },
  terms: { es: "/es/legal/terminos", en: "/en/legal/terms" },
};

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const lastModified = new Date();
  for (const key of Object.keys(PATHS)) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${BASE}${PATHS[key][locale]}`,
        lastModified,
        alternates: {
          languages: Object.fromEntries(routing.locales.map((l) => [l, `${BASE}${PATHS[key][l]}`])),
        },
      });
    }
  }
  return entries;
}
```

- [ ] **Step 2: Create `src/app/robots.ts`**

```ts
import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
```

- [ ] **Step 3: Verify**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm dev
```

Visit `http://localhost:3000/sitemap.xml` and `/robots.txt`. Both should render valid output.

- [ ] **Step 4: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(seo): add sitemap.xml + robots.txt

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 42 — Favicon + OG images

**Files:**

- Create: `scripts/build-static-assets.mjs`, `public/favicon.ico`, `public/icon.svg`, `public/apple-touch-icon.png`, `public/og-image-es.png`, `public/og-image-en.png`

- [ ] **Step 1: Create `scripts/build-static-assets.mjs`**

```js
import sharp from "sharp";
import fs from "node:fs/promises";

const SHIELD_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110">
  <rect width="100" height="110" rx="22" fill="#225560"/>
  <path d="M28 62 Q50 92 72 62 Z" fill="#E9EA8A"/>
  <rect x="26" y="56" width="48" height="8" rx="4" fill="#E9EA8A"/>
  <rect x="56" y="22" width="8" height="42" rx="4" transform="rotate(20 60 43)" fill="#E9EA8A"/>
</svg>
`;

await fs.writeFile("public/icon.svg", SHIELD_SVG.trim());

await sharp(Buffer.from(SHIELD_SVG)).resize(180, 180).png().toFile("public/apple-touch-icon.png");
await sharp(Buffer.from(SHIELD_SVG)).resize(32, 32).png().toFile("public/favicon-32.png");
await sharp(Buffer.from(SHIELD_SVG)).resize(16, 16).png().toFile("public/favicon-16.png");
// Simple ICO via sharp: re-encode the 32×32 PNG as ICO.
// (For multi-resolution ICOs, use an external tool; one resolution is fine here.)
await fs.copyFile("public/favicon-32.png", "public/favicon.ico");

// OG images
function ogSvg({ slogan, secondary }: { slogan: string; secondary: string }) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#225560"/>
  <g transform="translate(80,140)">
    <text x="0" y="0" font-family="Montserrat, sans-serif" font-weight="800" font-size="84" fill="#E9EA8A">${slogan}</text>
    <text x="0" y="120" font-family="Montserrat, sans-serif" font-weight="600" font-size="40" fill="#F5F6F7">${secondary}</text>
    <text x="0" y="380" font-family="Montserrat, sans-serif" font-weight="700" font-size="32" fill="#F5F6F7">Santa Cruz Compounding Academy</text>
    <text x="0" y="420" font-family="Montserrat, sans-serif" font-weight="500" font-size="24" fill="#F5F6F7" fill-opacity="0.8">USP 795 · USP 800</text>
  </g>
</svg>
`;
}

await sharp(Buffer.from(ogSvg({ slogan: "Educamos para formar", secondary: "Bienestar y salud." })))
  .png()
  .toFile("public/og-image-es.png");

await sharp(Buffer.from(ogSvg({ slogan: "We educate to build", secondary: "Wellness and health." })))
  .png()
  .toFile("public/og-image-en.png");

console.log("Static assets built.");
```

(Note: the script uses TS-style annotations but is .mjs — strip the annotations if Node complains. Or rename to `.ts` and run via `tsx`. For simplicity, rewrite the function in plain JS:)

Replace the `ogSvg` function with:

```js
function ogSvg(slogan, secondary) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#225560"/>
  <g transform="translate(80,140)">
    <text x="0" y="0" font-family="Montserrat, sans-serif" font-weight="800" font-size="84" fill="#E9EA8A">${slogan}</text>
    <text x="0" y="120" font-family="Montserrat, sans-serif" font-weight="600" font-size="40" fill="#F5F6F7">${secondary}</text>
    <text x="0" y="380" font-family="Montserrat, sans-serif" font-weight="700" font-size="32" fill="#F5F6F7">Santa Cruz Compounding Academy</text>
    <text x="0" y="420" font-family="Montserrat, sans-serif" font-weight="500" font-size="24" fill="#F5F6F7" fill-opacity="0.8">USP 795 · USP 800</text>
  </g>
</svg>
`;
}

// And update the two calls:
await sharp(Buffer.from(ogSvg("Educamos para formar", "Bienestar y salud.")))
  .png()
  .toFile("public/og-image-es.png");
await sharp(Buffer.from(ogSvg("We educate to build", "Wellness and health.")))
  .png()
  .toFile("public/og-image-en.png");
```

- [ ] **Step 2: Add to package.json scripts**

```json
"build:assets": "node scripts/build-static-assets.mjs"
```

- [ ] **Step 3: Run it**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm build:assets
```

Expected: `public/favicon.ico`, `public/icon.svg`, `public/apple-touch-icon.png`, `public/og-image-{es,en}.png` exist.

- [ ] **Step 4: Add icon metadata to root**

The `metadataBase` in `src/lib/seo.ts` already handles this, but to ensure favicon is wired, add to root `src/app/layout.tsx` `metadata`:

```ts
export const metadata: Metadata = {
  title: "Santa Cruz Compounding Academy",
  description: "Educamos para formar bienestar y salud.",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
};
```

- [ ] **Step 5: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "feat(seo): generate favicons + OG share images from shield

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 43 — Skip link + a11y polish

**Files:**

- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Add a "Skip to content" link**

In `src/app/[locale]/layout.tsx`, inside `<body>` and before `<Header>`:

```tsx
<a
  href="#content"
  className="focus:bg-chartreuse focus:text-teal-deep sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:px-4 focus:py-2 focus:font-semibold"
>
  {/* Translated message resolved client-side via a small component, or just use English fallback here. */}
  Skip to content
</a>
```

Then enhance: replace `Skip to content` with a `useTranslations` call inside a tiny client component.

Create `src/components/layout/SkipLink.tsx`:

```tsx
"use client";
import { useTranslations } from "next-intl";

export function SkipLink() {
  const t = useTranslations("common");
  return (
    <a
      href="#content"
      className="focus:bg-chartreuse focus:text-teal-deep sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:px-4 focus:py-2 focus:font-semibold"
    >
      {t("skipToContent")}
    </a>
  );
}
```

Use it in the locale layout:

```tsx
import { SkipLink } from "@/components/layout/SkipLink";
// inside <body>:
<SkipLink />
<Header locale={locale as "es" | "en"} />
```

- [ ] **Step 2: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "a11y: add Skip to content link

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 44 — E2E: brand lint check

**Files:**

- Create: `tests/e2e/brand-lint.spec.ts`

> This isn't really E2E (no browser) — it's a smoke test that lives in the e2e folder for convenience. It runs the brand lint across the source tree.

- [ ] **Step 1: Create the test**

```ts
import { test, expect } from "@playwright/test";
import { execSync } from "node:child_process";

test("no hex literals outside src/lib/brand.ts", () => {
  // ripgrep all .ts/.tsx files for 6-digit hex codes
  let output = "";
  try {
    output = execSync(
      String.raw`rg -t ts -t tsx "#[0-9A-Fa-f]{6}" src/ --glob "!src/lib/brand.ts" --glob "!src/eslint-rules/**"`,
      { stdio: ["ignore", "pipe", "pipe"] },
    ).toString();
  } catch (err: any) {
    // ripgrep exits 1 when no matches — that's success here.
    if (err.status === 1) return;
    throw err;
  }
  // If we get here, ripgrep found matches.
  expect(output, `Found hex literals outside lib/brand.ts:\n${output}`).toBe("");
});
```

> If `rg` is not installed on the dev machine, swap to plain `grep -RIE`. The output check is the same.

- [ ] **Step 2: Run**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm test:e2e tests/e2e/brand-lint.spec.ts
```

Expected: pass.

- [ ] **Step 3: Commit**

```bash
cd ~/Desktop/sccompoundingacademy-web && git add -A && git commit -m "test: assert no hex literals outside lib/brand.ts

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 45 — Production build sanity

**Files:** none (verification only)

- [ ] **Step 1: Run a production build**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm build
```

Expected: build completes with no errors. Routes for both locales are reported. Look for the line `○ (Static)` next to each public route — these are statically prerendered.

- [ ] **Step 2: Run production server and visit**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm start
```

Visit `/`, `/es`, `/en`, `/es/cursos`, `/en/courses`, `/es/contacto`, `/en/contact`, `/es/legal/privacidad`, `/en/legal/terms`. Confirm every route renders. Kill server.

- [ ] **Step 3: Run all checks**

```bash
cd ~/Desktop/sccompoundingacademy-web && pnpm typecheck && pnpm check:i18n && pnpm exec eslint . && pnpm test && pnpm test:e2e
```

Expected: all green.

- [ ] **Step 4: Commit (a no-op commit to mark the milestone)**

```bash
cd ~/Desktop/sccompoundingacademy-web && git commit --allow-empty -m "milestone: Plan 1 complete — marketing site builds and passes all checks

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review Notes

**Spec coverage check:**

- §1 Stack — Tasks 1, 2, 8, 10, 11 ✓
- §2 Routes — Tasks 11, 33, 34, 35 ✓
- §3 Data model — not in Plan 1 (deferred to Plan 2) ✓
- §4 Enrollment flow — not in Plan 1 (deferred to Plan 2) ✓
- §5 Admin — not in Plan 1 ✓
- §6 Blender mortar — Tasks 37, 38, 39 ✓
- §7 Bilingual — Tasks 11, 12, 13, 18 ✓
- §8 Brand tokens — Tasks 7, 8, 9, 14–20, 21 ✓
- Brand applications (billboard hero, tagline band, pattern divider) — Tasks 25, 26, 30 ✓
- SEO — Tasks 40, 41, 42 ✓

**Placeholder scan:** no TBDs / TODOs / "similar to" / unspecified code.

**Type consistency:** `LocaleSwitch` accepts `currentLocale`, `Header` accepts `locale`, both typed as `"es" | "en"`. `HeroBillboard` doesn't need locale (uses `useTranslations`). Components inside server tree are not marked `"use client"` unless they need it (LocaleSwitch, Accordion, FAQ, ContactForm, HeroMortar, SkipLink are client; everything else server).

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-16-plan-1-foundation-and-marketing.md`. **45 tasks total.**

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
