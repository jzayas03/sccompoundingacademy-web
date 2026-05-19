import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config — used by `pnpm db:generate` (creates SQL migration
 * files in `./drizzle`) and `pnpm db:migrate` (applies them against
 * `DATABASE_URL`).
 *
 * The schema lives at `src/lib/db/schema.ts`. Migrations are committed to
 * git so prod deploys apply them deterministically.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://placeholder:placeholder@placeholder.invalid:5432/placeholder",
  },
  strict: true,
  verbose: true,
});
