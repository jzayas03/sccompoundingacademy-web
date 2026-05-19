/**
 * MeshBackground — soft brand-tinted gradient mesh rendered behind the
 * student-portal UI. Provides the underlying color variation that makes
 * the medium glassmorphism (`.glass-card`) actually look glassy — over a
 * flat background, the backdrop blur has nothing to blur.
 *
 * Pure SVG so there is zero runtime cost (no canvas, no rAF, no JS state)
 * and `aria-hidden` so screen readers skip it. Fixed positioning means
 * the mesh stays put while content scrolls; long pages don't paint a
 * gigantic SVG every scroll tick.
 *
 * The four radial gradients use brand tokens at low opacity so the mesh
 * reads as "tinted off-white" rather than a saturated decoration. Tweak
 * `opacity` on the wrapper to dial intensity across portal pages.
 */
export function MeshBackground({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}
    >
      <svg
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <defs>
          <radialGradient id="mesh-teal-deep" cx="20%" cy="20%" r="60%">
            <stop offset="0%" stopColor="var(--color-teal-deep)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--color-teal-deep)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="mesh-chartreuse" cx="85%" cy="15%" r="50%">
            <stop offset="0%" stopColor="var(--color-chartreuse)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-chartreuse)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="mesh-sand" cx="15%" cy="85%" r="55%">
            <stop offset="0%" stopColor="var(--color-sand)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-sand)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="mesh-teal-mid" cx="80%" cy="80%" r="55%">
            <stop offset="0%" stopColor="var(--color-teal)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--color-teal)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Off-white base so the mesh always renders against a known color
            even when the surrounding page sets a different background. */}
        <rect width="1200" height="800" fill="var(--color-off-white)" />

        <rect width="1200" height="800" fill="url(#mesh-teal-deep)" />
        <rect width="1200" height="800" fill="url(#mesh-chartreuse)" />
        <rect width="1200" height="800" fill="url(#mesh-sand)" />
        <rect width="1200" height="800" fill="url(#mesh-teal-mid)" />
      </svg>
    </div>
  );
}
