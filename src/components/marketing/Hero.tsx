import Image from "next/image";
import { useTranslations, useMessages } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { SpecRail } from "@/components/ui/SpecRail";

/**
 * Hero — top of the landing page. "El Formulario" direction:
 *
 * Deep-teal clinical floor (authority), a monospace spec-rail of standards
 * (the signature — encodes USP chapters, ACPE #, hours, location), an Outfit
 * XL headline with a SINGLE chartreuse "measure" mark, one strong chartreuse
 * CTA + one quiet link, and a framed real bench photograph — proof, not
 * decoration. Asymmetric on lg (7/5). No glass, no gradient blob.
 *
 * Not wrapped in <Reveal> — above the fold.
 */
export function Hero() {
  const t = useTranslations("hero");
  const messages = useMessages() as unknown as { hero: { trustItems: string[] } };
  const specs = messages.hero.trustItems;

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="bg-teal-deep text-off-white relative isolate"
    >
      <Container className="grid grid-cols-1 items-center gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:gap-x-14 lg:py-28">
        {/* Text column */}
        <div className="lg:col-span-7 flex flex-col">
          {/* Signature: the standards spec-rail (mono, muted off-white). */}
          <SpecRail items={specs} className="text-off-white/60 [&_.spec-tag]:text-off-white/60" />

          <h1
            id="hero-heading"
            className="font-heading mt-7 text-4xl font-bold leading-[1.03] tracking-[-0.03em] text-balance sm:text-5xl lg:text-[3.5rem] xl:text-6xl"
          >
            {t("headline")}
          </h1>

          {/* The one chartreuse "measure" — a single precise mark. */}
          <span aria-hidden className="bg-chartreuse mt-6 block h-1 w-16 rounded-full" />

          <p className="text-off-white/85 mt-6 max-w-xl text-base leading-relaxed sm:text-lg">
            {t("subheadline")}
          </p>

          {/* One strong CTA + one quiet link — a single accent per view. */}
          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link
              href="/cursos"
              className="bg-chartreuse text-teal-deep ring-chartreuse/20 shadow-soft hover:bg-chartreuse/95 hover:shadow-lift focus-visible:ring-chartreuse font-heading inline-flex h-12 items-center justify-center rounded-[13px] px-7 text-sm font-semibold ring-1 transition-[background-color,box-shadow,transform] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-deep focus-visible:outline-none motion-safe:hover:-translate-y-px sm:h-14 sm:text-base"
            >
              {t("primaryCta")}
            </Link>
            <Link
              href="/contacto"
              className="text-off-white/90 hover:text-chartreuse focus-visible:ring-chartreuse font-heading inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold underline-offset-4 transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-deep focus-visible:outline-none sm:text-base"
            >
              {t("secondaryCta")}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        {/* Photograph — proof, framed on teal. DOM order after text so mobile
            reads message → photo. */}
        <div className="lg:col-span-5">
          <div className="border-off-white/15 relative aspect-[4/5] w-full overflow-hidden rounded-[13px] border sm:aspect-[16/10] lg:aspect-[4/5]">
            <Image
              src="/photos/photo-frontispiece.jpg"
              alt={t("imageAlt")}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
