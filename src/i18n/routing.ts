import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "always",
  localeDetection: false,
  pathnames: {
    "/": "/",
    "/cursos": { es: "/cursos", en: "/courses" },
    "/contacto": { es: "/contacto", en: "/contact" },
    "/inscripcion": { es: "/inscripcion", en: "/enroll" },
    "/inscripcion/exito": { es: "/inscripcion/exito", en: "/enroll/success" },
    "/inscripcion/cancelada": { es: "/inscripcion/cancelada", en: "/enroll/cancelled" },
    "/legal/privacidad": { es: "/legal/privacidad", en: "/legal/privacy" },
    "/legal/terminos": { es: "/legal/terminos", en: "/legal/terms" },
    "/legal/reembolso": { es: "/legal/reembolso", en: "/legal/refund" },
    // Student portal — same URL in both locales (Phase A is ES-only, but
    // the routes still resolve under the locale prefix so the next-intl
    // middleware can hand them off to the page tree).
    "/portal": "/portal",
    "/portal/login": "/portal/login",
    "/portal/verify": "/portal/verify",
  },
});

export type AppPathname = keyof typeof routing.pathnames;

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
