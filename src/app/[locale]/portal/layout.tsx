import { MeshBackground } from "@/components/glass/MeshBackground";

/**
 * Portal namespace layout — wraps every `/portal/*` page with a fixed
 * MeshBackground so the medium glassmorphism on `<GlassCard />` has real
 * color variation to blur against. The existing `[locale]/layout.tsx`
 * still provides the marketing Header + Footer; the portal-specific
 * GlassNav lands in PR 8 alongside the broader brand-parity polish.
 */
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MeshBackground />
      <div className="relative">{children}</div>
    </>
  );
}
