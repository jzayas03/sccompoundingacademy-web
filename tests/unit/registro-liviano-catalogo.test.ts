/**
 * Registro liviano (spec 2026-09-04) — catálogo, audiencia y validación.
 *
 * Cubre las piezas puras del PR 2: el curso `parte-2` y el tier
 * `subgraduado` existen en el catálogo marcados `registrationOnly`, la
 * audiencia nueva mapea desde el tier, y el zod de inscripción acepta
 * subgraduado sin profesión (pero la sigue exigiendo a profesional).
 */
import { describe, it, expect } from "vitest";
import { COURSES, getCourseById, getPricingByTier } from "@/lib/courses";
import {
  enrolleeAudience,
  visibleAudiences,
  AUDIENCE_LABELS,
} from "@/lib/cohorts/audience";
import { inscripcionSchema } from "@/lib/inscripcion/schema";

describe("catálogo — parte-2", () => {
  const parte2 = getCourseById("parte-2");

  it("existe: 2 días, sin bloque ACPE (sin CE)", () => {
    expect(parte2).toBeDefined();
    expect(parte2!.days).toBe(2);
    expect(parte2!.acpe).toBeUndefined();
  });

  it("tier profesional a $1,745 y TODO su pricing es solo-registro", () => {
    const prof = getPricingByTier(parte2!, "profesional");
    expect(prof?.priceUsdCents).toBe(174_500);
    expect(prof?.stripePriceEnvKey).toBe("STRIPE_PRICE_ID_PARTE2_PROFESIONAL");
    expect(parte2!.pricing.every((p) => p.registrationOnly === true)).toBe(true);
  });
});

describe("catálogo — tier subgraduado del básico", () => {
  const basico = getCourseById("basic-compounding");

  it("existe como pricing solo-registro con su propio env", () => {
    const sub = getPricingByTier(basico!, "subgraduado");
    expect(sub).toBeDefined();
    expect(sub!.registrationOnly).toBe(true);
    expect(sub!.stripePriceEnvKey).toBe("STRIPE_PRICE_ID_BASICO_SUBGRADUADO");
  });

  it("los tiers con cuenta de portal del básico NO son solo-registro", () => {
    expect(getPricingByTier(basico!, "profesional")!.registrationOnly).toBeUndefined();
    expect(getPricingByTier(basico!, "student")!.registrationOnly).toBeUndefined();
  });
});

describe("catálogo — displayTitle para emails server-side", () => {
  it("todo curso tiene título display en ES y EN", () => {
    for (const c of COURSES) {
      expect(c.displayTitle.es.length).toBeGreaterThan(0);
      expect(c.displayTitle.en.length).toBeGreaterThan(0);
    }
  });
});

describe("audiencia — subgraduado", () => {
  it("enrolleeAudience mapea el tier a su audiencia dedicada", () => {
    expect(enrolleeAudience("subgraduado", null)).toBe("subgraduado");
    expect(visibleAudiences("subgraduado", null)).toEqual(["subgraduado"]);
  });

  it("tiene etiquetas ES/EN", () => {
    expect(AUDIENCE_LABELS.subgraduado.es.length).toBeGreaterThan(0);
    expect(AUDIENCE_LABELS.subgraduado.en.length).toBeGreaterThan(0);
  });
});

describe("zod — tier subgraduado", () => {
  const base = {
    nombre: "Ana Torres",
    email: "ana@example.com",
    telefono: "7871234567",
    curso_id: "basic-compounding",
    cohorte_id: "c1",
    acepto_terminos: true as const,
    acepto_version_docs: "2026-01-01",
    locale: "es" as const,
  };

  it("acepta subgraduado SIN tipo_profesional", () => {
    const r = inscripcionSchema.safeParse({ ...base, tier: "subgraduado" });
    expect(r.success).toBe(true);
  });

  it("sigue exigiendo tipo_profesional al tier profesional", () => {
    const r = inscripcionSchema.safeParse({ ...base, tier: "profesional" });
    expect(r.success).toBe(false);
  });
});
