import { PortalBackdrop } from "@/components/glass/PortalBackdrop";
import { GlassNav } from "@/components/portal/GlassNav";
import { auth } from "@/lib/auth";

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
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Nav only renders for signed-in learners; the login + verify pages are
  // unauthenticated and read as clean glass modals over the backdrop.
  const session = await auth();
  return (
    <>
      <PortalBackdrop />
      {session?.user ? <GlassNav /> : null}
      <div className="relative">{children}</div>
    </>
  );
}
