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
    "/inscripcion/revision": { es: "/inscripcion/revision", en: "/enroll/review" },
    "/inscripcion/pago-cerrado": { es: "/inscripcion/pago-cerrado", en: "/enroll/payment-closed" },
    "/legal/privacidad": { es: "/legal/privacidad", en: "/legal/privacy" },
    "/legal/terminos": { es: "/legal/terminos", en: "/legal/terms" },
    "/legal/reembolso": { es: "/legal/reembolso", en: "/legal/refund" },
    // Student portal — same URL in both locales (Phase A is ES-only, but
    // the routes still resolve under the locale prefix so the next-intl
    // middleware can hand them off to the page tree).
    "/portal": "/portal",
    "/portal/login": "/portal/login",
    "/portal/verify": "/portal/verify",
    "/portal/modulos/[id]": "/portal/modulos/[id]",
    "/portal/modulos/[id]/pre-test": "/portal/modulos/[id]/pre-test",
    "/portal/modulos/[id]/post-test": "/portal/modulos/[id]/post-test",
    "/portal/modulos/[id]/post-test/resultados":
      "/portal/modulos/[id]/post-test/resultados",
    "/portal/certificado": "/portal/certificado",
    // The reviews page lives at the ASCII filesystem segment `resenas` —
    // Next.js's routes-manifest stores the dir name verbatim in the URL
    // matcher regex, and browsers always send the percent-encoded form
    // (`rese%C3%B1as`) of any ñ in the URL. Those two never match, so a
    // literal-ñ directory ends up 404ing in production. The public URL
    // keeps the Spanish-native `reseñas` via the localized mapping
    // below; canonical (used in <Link href>) is the ASCII slug.
    "/portal/resenas": { es: "/portal/reseñas", en: "/portal/reseñas" },
    "/portal/admin": "/portal/admin",
    "/portal/admin/cohortes": "/portal/admin/cohortes",
  },
});

export type AppPathname = keyof typeof routing.pathnames;

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
