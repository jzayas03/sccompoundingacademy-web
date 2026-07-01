"use client";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/cn";

/**
 * PortalSidebar — glass left rail for the authenticated portal shell
 * (SCCA Portal handoff, `Sidebar`). Persistent nav with line icons and a
 * chartreuse-pill active state, admin panel gated below a divider.
 *
 * Hidden below `lg` (the top glass nav carries navigation on small
 * screens). Active state derives from the current pathname. "Pretest" is
 * intentionally omitted — in the real app pretests are per-module, not a
 * standalone view.
 */
const svg = {
  width: 18,
  height: 18,
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
const IconGrid = () => (
  <svg {...svg}>
    <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.5" />
    <rect x="11" y="11" width="6.5" height="6.5" rx="1.5" />
  </svg>
);
const IconStar = () => (
  <svg {...svg}>
    <path d="M10 2.6l2.24 4.54 5.01.73-3.63 3.53.86 4.99L10 13.98l-4.48 2.41.86-4.99-3.63-3.53 5.01-.73L10 2.6z" />
  </svg>
);
const IconAward = () => (
  <svg {...svg}>
    <circle cx="10" cy="7.3" r="4.8" />
    <path d="M7 11.3L5.6 18l4.4-2.4 4.4 2.4-1.4-6.7" />
  </svg>
);
const IconShield = () => (
  <svg {...svg}>
    <path d="M10 2.2l6.2 2.3v4.9c0 4.2-2.6 7.3-6.2 8.4-3.6-1.1-6.2-4.2-6.2-8.4V4.5L10 2.2z" />
    <path d="M7.2 9.6l2 2 3.4-3.9" />
  </svg>
);

type Item = { href: string; label: string; Icon: () => React.JSX.Element; active: boolean };

export function PortalSidebar({ isAdmin }: { isAdmin: boolean }) {
  const t = useTranslations("portal.sidebar");
  const pathname = usePathname();

  const items: Item[] = [
    { href: "/portal", label: t("modules"), Icon: IconGrid, active: pathname === "/portal" },
    {
      href: "/portal/resenas",
      label: t("reviews"),
      Icon: IconStar,
      active: pathname.startsWith("/portal/rese"),
    },
    {
      href: "/portal/certificado",
      label: t("certificate"),
      Icon: IconAward,
      active: pathname.startsWith("/portal/certificado"),
    },
  ];
  const adminItem: Item = {
    href: "/portal/admin",
    label: t("admin"),
    Icon: IconShield,
    active: pathname.startsWith("/portal/admin"),
  };

  const renderItem = ({ href, label, Icon, active }: Item) => (
    <Link
      key={href}
      href={href as never}
      aria-current={active ? "page" : undefined}
      className={cn(
        "font-heading flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[10px] px-3.5 py-2.5 text-[13.5px] transition-colors",
        active
          ? "bg-chartreuse/30 text-teal-deep font-bold"
          : "text-teal-deep/60 hover:text-teal-deep hover:bg-teal-deep/5 font-medium",
      )}
    >
      <span className="shrink-0">
        <Icon />
      </span>
      {label}
    </Link>
  );

  return (
    <aside
      aria-label={t("nav")}
      className="glass-card flex w-full shrink-0 gap-1 self-start overflow-x-auto rounded-[20px] border border-white/40 p-2.5 lg:sticky lg:top-[88px] lg:w-[222px] lg:flex-col lg:gap-0.5 lg:overflow-visible lg:p-3.5"
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      {items.map(renderItem)}
      {isAdmin && (
        <>
          <div className="bg-teal-deep/12 mx-1 my-auto h-6 w-px shrink-0 lg:my-2 lg:h-px lg:w-auto" />
          {renderItem(adminItem)}
        </>
      )}
    </aside>
  );
}
