import { PortalBackdrop } from "@/components/glass/PortalBackdrop";
import { GlassNav } from "@/components/portal/GlassNav";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

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
  // Nav + sidebar only render for signed-in learners; the login + verify
  // pages are unauthenticated and read as clean glass modals over the
  // backdrop. The sidebar is `lg`-only; content stays full-width on mobile.
  const session = await auth();
  const isSignedIn = Boolean(session?.user);
  const isAdmin = isAdminEmail(session?.user?.email);
  return (
    <>
      <PortalBackdrop />
      {isSignedIn ? (
        <>
          <GlassNav />
          <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:gap-8 lg:px-8">
            <PortalSidebar isAdmin={isAdmin} />
            <main className="min-w-0 flex-1">{children}</main>
          </div>
        </>
      ) : (
        <div className="relative">{children}</div>
      )}
    </>
  );
}
