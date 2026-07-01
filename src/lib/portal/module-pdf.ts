import "server-only";

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Course material (the PAID product) lives OUTSIDE `/public` — under
 * `private/modulos/` — so it is never statically served. The only way to
 * the bytes is the authenticated `/api/portal/modulo/[id]/pdf` route, which
 * re-runs the tier + matrícula-verification + payment gate before streaming
 * (Edge middleware can't check `paidAt`, so static hosting could never be
 * safe here). The files are bundled into the serverless functions that read
 * them via `outputFileTracingIncludes` in `next.config.ts`.
 *
 * Owner workflow: drop `{basename}.pdf` (and optional `{basename}-en.pdf`)
 * into `private/modulos/` — same as before, just not under `public/`.
 */
const MODULOS_DIR = join(process.cwd(), "private", "modulos");

function fileName(basename: string, lang: "es" | "en"): string {
  return lang === "en" ? `${basename}-en.pdf` : `${basename}.pdf`;
}

export function moduloPdfExists(basename: string, lang: "es" | "en"): boolean {
  return existsSync(join(MODULOS_DIR, fileName(basename, lang)));
}

export async function readModuloPdf(
  basename: string,
  lang: "es" | "en",
): Promise<Buffer | null> {
  try {
    return await readFile(join(MODULOS_DIR, fileName(basename, lang)));
  } catch {
    return null;
  }
}
