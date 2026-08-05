import { describe, expect, it } from "vitest";
import es from "@/messages/es.json";
import en from "@/messages/en.json";
import { getCurriculum, getModuleCatalogue, type UserTier } from "@/lib/curriculum";

/**
 * The dashboard keys each card's step by the i18n catalogue's module
 * `id` and looks it up in the step map, which is keyed by the CURRICULUM
 * module id. If those two id sets ever drift, every lookup misses and
 * every card silently falls back to "start with the pre-test" — telling
 * a student who is halfway through to begin again, with no error
 * anywhere. This pins them together.
 */
const messages = [
  ["es", es],
  ["en", en],
] as const;

const tiers: ReadonlyArray<[UserTier, string]> = [
  ["profesional", "profesional"],
  ["student", "student"],
];

describe.each(messages)("%s catalogue", (_locale, msgs) => {
  it.each(tiers)("matches the %s curriculum module ids", (tier) => {
    const catalogue = getModuleCatalogue(msgs, tier).map((m) => m.id);
    const curriculum = getCurriculum(tier).map((m) => m.id);
    expect(catalogue).toEqual(curriculum);
  });
});
