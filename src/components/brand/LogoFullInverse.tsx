import { LogoFull } from "./LogoFull";

/**
 * Kept as a thin alias of LogoFull so existing call sites keep working.
 *
 * Historical context: the original implementation rendered different
 * colors for dark vs light backgrounds. The brandsheet provides one
 * canonical lockup with the teal-deep card baked in, so light/dark
 * variants are no longer meaningful — the same asset works on every
 * surface in the design system.
 */
export const LogoFullInverse = LogoFull;
