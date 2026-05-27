import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PortalLocaleSwitch } from "@/components/portal/PortalLocaleSwitch";

// Each test sets `pathname` before calling render() — the mocked module
// reads from this variable at module-load time and on every usePathname()
// call, so it stays a single source of truth across the suite.
let pathname = "/portal";

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
  usePathname: () => pathname,
  routing: { locales: ["es", "en"] },
}));

describe("PortalLocaleSwitch", () => {
  beforeEach(() => {
    pathname = "/portal";
  });

  it("renders the toggle on the dashboard", () => {
    pathname = "/portal";
    render(<PortalLocaleSwitch currentLocale="es" />);
    expect(screen.getByRole("link", { name: "ES" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "EN" })).toBeInTheDocument();
  });

  it("renders the toggle on the certificate page", () => {
    pathname = "/portal/certificado";
    render(<PortalLocaleSwitch currentLocale="en" />);
    expect(screen.getByRole("link", { name: "EN" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("renders the toggle on a module overview", () => {
    pathname = "/portal/modulos/dia-1";
    render(<PortalLocaleSwitch currentLocale="es" />);
    expect(screen.getByRole("link", { name: "EN" })).toBeInTheDocument();
  });

  it("hides the toggle during a pre-test", () => {
    pathname = "/portal/modulos/dia-1/pre-test";
    const { container } = render(<PortalLocaleSwitch currentLocale="es" />);
    expect(container.firstChild).toBeNull();
  });

  it("hides the toggle during a post-test", () => {
    pathname = "/portal/modulos/dia-2/post-test";
    const { container } = render(<PortalLocaleSwitch currentLocale="es" />);
    expect(container.firstChild).toBeNull();
  });

  it("hides the toggle on the post-test results screen", () => {
    pathname = "/portal/modulos/dia-3/post-test/resultados";
    const { container } = render(<PortalLocaleSwitch currentLocale="en" />);
    expect(container.firstChild).toBeNull();
  });
});
