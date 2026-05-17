import Image from "next/image";
import { useTranslations, useMessages } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

type Post = { caption: string; href: string; src: string };

/**
 * InstagramFeatured — curated grid of recent posts from
 * @santacruzpharmacare.
 *
 * Sober 4-card grid (1/2/4 responsive) of recent Instagram posts from
 * the affiliated pharmacy. Each card carries a 1:1 thumbnail + 1-line
 * caption + small "Ver en Instagram →" link that opens the post in a
 * new tab.
 *
 * Why curated (vs. embedded IG iframe or Graph API): the embedded
 * iframe loads ~250 KB of Meta's script and renders the IG visual
 * language verbatim, which clashes with the medical-clean direction.
 * The Graph API would require a Facebook Developer App + business
 * token with refresh every ~60 days — a project, not a quick add.
 * A curated grid stays on-brand, zero external dependencies, zero
 * tracking. Trade-off: requires manual update when the user wants to
 * rotate featured posts (drop a new image into /public/instagram/ +
 * edit i18n caption + href).
 *
 * Section header includes a "Ver perfil →" link to the IG profile so
 * users who want the live feed have a one-tap route there.
 */
export function InstagramFeatured() {
  const t = useTranslations("instagramFeatured");
  const messages = useMessages() as unknown as {
    instagramFeatured: { items: Post[] };
    footer: { instagramUrl: string };
  };
  const items = messages.instagramFeatured.items;
  const profileUrl = messages.footer.instagramUrl;

  return (
    <section
      id="instagram"
      aria-labelledby="instagram-heading"
      className="bg-white border-gray-300 border-t"
    >
      <Container className="py-20 sm:py-24 lg:py-28">
        <Reveal>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
            <div className="max-w-2xl">
              <p className="font-heading text-teal-deep/70 flex items-center text-xs font-semibold tracking-[0.18em] uppercase sm:text-sm">
                <span aria-hidden className="bg-chartreuse mr-3 inline-block h-4 w-1 shrink-0 rounded-sm" />
                {t("eyebrow")}
              </p>
              <h2
                id="instagram-heading"
                className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl lg:text-5xl"
              >
                {t("heading")}
              </h2>
              <p className="text-gray-900 mt-5 text-base leading-relaxed sm:text-lg">
                {t("intro")}
              </p>
            </div>

            {/* Profile link — anchor right of the header on sm+ so the
                heading reads as primary and the link as supporting. */}
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-heading text-teal-deep hover:text-teal group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold transition-colors sm:text-base"
              aria-label={t("profileCtaAria")}
            >
              <span>{t("profileCta")}</span>
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </a>
          </div>
        </Reveal>

        <Reveal
          as="ul"
          className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:mt-14 lg:grid-cols-4 lg:gap-6"
        >
          {items.map((post) => (
            <li key={post.src} className="h-full">
              <a
                href={post.href}
                target="_blank"
                rel="noopener noreferrer"
                className="border-gray-300 group block h-full overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-soft"
                aria-label={`${t("postLinkAria")}: ${post.caption}`}
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={post.src}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                </div>
                <div className="border-gray-300 border-t p-4 sm:p-5">
                  <p className="text-gray-900 line-clamp-2 text-sm leading-snug sm:text-base">
                    {post.caption}
                  </p>
                  <p className="text-teal-deep group-hover:text-teal font-heading mt-3 inline-flex items-center gap-1 text-xs font-semibold tracking-wide uppercase transition-colors sm:text-sm">
                    <span>{t("postCta")}</span>
                    <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </p>
                </div>
              </a>
            </li>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
