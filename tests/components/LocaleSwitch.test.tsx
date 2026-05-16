import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleSwitch } from "@/components/ui/LocaleSwitch";

vi.mock("@/i18n/routing", () => ({
  Link: ({
    href,
    children,
    locale,
    ...rest
  }: {
    href: string | { pathname: string };
    children: React.ReactNode;
    locale?: string;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === "string" ? href : "/"} data-locale={locale} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => "/cursos",
  routing: { locales: ["es", "en"] },
}));

describe("LocaleSwitch", () => {
  it("renders both ES and EN options", () => {
    render(<LocaleSwitch currentLocale="es" />);
    expect(screen.getByRole("link", { name: "ES" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "EN" })).toBeInTheDocument();
  });

  it("marks the current locale as active via aria-current", () => {
    render(<LocaleSwitch currentLocale="es" />);
    expect(screen.getByRole("link", { name: "ES" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "EN" })).not.toHaveAttribute("aria-current");
  });
});
