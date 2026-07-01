/**
 * SectionBanner — the 140px photo banner that opens every portal view
 * (SCCA Portal handoff, `SectionBanner`). A blurred, saturated contextual
 * photo under a teal gradient wash, with a chartreuse uppercase eyebrow
 * and a bold off-white title. Each view passes its own photo.
 *
 * Decorative photo is a CSS background (aria-hidden); the heading carries
 * the accessible name.
 */
export function SectionBanner({
  photo,
  eyebrow,
  title,
}: {
  photo: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="relative mb-7 h-[140px] shrink-0 overflow-hidden rounded-[20px]">
      <div
        aria-hidden
        className="absolute -inset-2.5"
        style={{
          backgroundImage: `url(${photo})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(3px) saturate(1.05)",
          transform: "scale(1.05)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, rgba(18,60,69,0.90) 0%, rgba(25,85,97,0.58) 55%, rgba(25,85,97,0.25) 100%)",
        }}
      />
      <div className="relative flex h-full flex-col justify-center px-8">
        <p className="text-chartreuse font-heading text-[0.68rem] font-bold tracking-[0.16em] uppercase">
          {eyebrow}
        </p>
        <h1 className="font-heading text-off-white text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">
          {title}
        </h1>
      </div>
    </div>
  );
}
