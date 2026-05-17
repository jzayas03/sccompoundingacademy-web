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
    "/legal/privacidad": { es: "/legal/privacidad", en: "/legal/privacy" },
    "/legal/terminos": { es: "/legal/terminos", en: "/legal/terms" },
    "/legal/reembolso": { es: "/legal/reembolso", en: "/legal/refund" },
  },
});

export type AppPathname = keyof typeof routing.pathnames;

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
