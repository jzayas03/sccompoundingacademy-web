/**
 * PortalBackdrop — the shared glass backdrop behind the whole student
 * portal (login + app shell), from the SCCA Portal design handoff (`Bg`).
 *
 * Layers, back to front: a full-bleed working-lab photo at 10% opacity, a
 * diagonal teal→off-white→sand gradient wash, and two large blurred colour
 * blobs (chartreuse top-left, teal bottom-right) that drift slowly. This
 * colour variation is what makes the `.glass-*` surfaces read as glass —
 * a flat background gives the backdrop-blur nothing to blur.
 *
 * Fixed + aria-hidden + pointer-events-none; the drift animation pauses
 * under `prefers-reduced-motion` (see `.portal-blob` in globals.css).
 * Replaces the older SVG `MeshBackground` in the portal layout.
 */
export function PortalBackdrop() {
  return (
    <div
      aria-hidden
      className="bg-off-white pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Working-lab photo, very faint */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/photos/photo-chemo-lab.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 0.1, filter: "blur(1px)" }}
      />
      {/* Diagonal gradient wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(25,85,97,0.16) 0%, rgba(243,243,244,0.55) 45%, rgba(234,225,214,0.35) 100%)",
        }}
      />
      {/* Chartreuse blob, top-left */}
      <div
        className="portal-blob absolute rounded-full"
        style={{
          top: "-8%",
          left: "-6%",
          width: 480,
          height: 480,
          background: "radial-gradient(circle, rgba(230,234,130,0.55), transparent 70%)",
          filter: "blur(60px)",
          animation: "portal-drift1 22s ease-in-out infinite",
        }}
      />
      {/* Teal blob, bottom-right */}
      <div
        className="portal-blob absolute rounded-full"
        style={{
          bottom: "-10%",
          right: "-8%",
          width: 560,
          height: 560,
          background: "radial-gradient(circle, rgba(34,134,152,0.45), transparent 70%)",
          filter: "blur(70px)",
          animation: "portal-drift2 26s ease-in-out infinite",
        }}
      />
    </div>
  );
}
