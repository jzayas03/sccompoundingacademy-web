import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // The paid course PDFs live outside /public (in private/modulos/), so
  // Next won't include them in the serverless bundle unless we trace them
  // into the functions that read them from disk: the authenticated stream
  // route and the module page's existence check.
  outputFileTracingIncludes: {
    "/api/portal/modulo/[id]/pdf": ["./private/modulos/**"],
    // Both variants — depending on Next's version the route-group segment
    // may or may not appear in the tracing key; extra keys are harmless.
    "/[locale]/(portal)/portal/modulos/[id]": ["./private/modulos/**"],
    "/[locale]/portal/modulos/[id]": ["./private/modulos/**"],
  },
};

export default withNextIntl(nextConfig);
