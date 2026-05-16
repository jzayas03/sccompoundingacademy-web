/**
 * Placeholder for the scroll-scrubbable mortar visual. Replaced by the real
 * HeroMortar component in Task 38; until then this just paints a soft glow.
 */
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
