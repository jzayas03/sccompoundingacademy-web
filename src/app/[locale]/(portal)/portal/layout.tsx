import { MeshBackground } from "@/components/glass/MeshBackground";
import { GlassNav } from "@/components/portal/GlassNav";

/**
 * Portal namespace layout. Replaces the marketing Header + Footer (now
 * scoped to the `(marketing)` route group) with a portal-specific stack:
 *
 *   - `MeshBackground` — fixed gradient mesh that gives the medium
 *     glassmorphism on `<GlassCard />` real color variation to blur
 *     against.
 *   - `GlassNav`        — sticky top header with the SCCA logo, the
 *     conditional sign-in/sign-out action, and just enough chrome for
 *     the portal to feel like its own product (not the landing page).
 *
 * The portal is intentionally chrome-less below the nav — no footer,
 * no extra padding — so the dashboard / module / certificate canvases
 * feel like a workspace rather than a marketing page.
 */
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MeshBackground />
      <GlassNav />
      <div className="relative">{children}</div>
    </>
  );
}
