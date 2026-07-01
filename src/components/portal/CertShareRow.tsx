"use client";
/* eslint-disable scca-brand/no-hex-literal -- official third-party brand
   colors (Facebook #1877F2, LinkedIn #0A66C2, the Instagram gradient) and
   white icon fills; these are the platforms' colors, not SCCA tokens. */
import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * CertShareRow — the "Share your certificate" button row for the glass
 * certificate view (SCCA Portal handoff, `CertificateView`/`ShareBtn`).
 *
 * Three circular brand buttons in the client's explicit order —
 * Instagram, Facebook, LinkedIn — wired to the REAL public verification
 * URL passed from the server (`sccompoundingacademy.com/verificar/<certNo>`,
 * or the generic `/verificar` index when no cert row exists yet, e.g. an
 * admin previewing):
 *
 *   - **Facebook** → `facebook.com/sharer` web share intent (new tab).
 *   - **LinkedIn** → `linkedin.com/sharing/share-offsite` intent (new tab).
 *   - **Instagram** → Instagram has NO public web share-intent URL, so we
 *     call `navigator.share()` (native OS sheet — includes Instagram on
 *     supported mobile browsers) when available, otherwise copy the link
 *     to the clipboard and surface a "paste it into your story/DM" note.
 *
 * `disabled` ghosts every button until the learner is certificate-
 * eligible, mirroring the download gate.
 */
export function CertShareRow({
  url,
  disabled,
}: {
  url: string;
  disabled: boolean;
}) {
  const t = useTranslations("portal.cert");
  const [copied, setCopied] = useState(false);

  const openIntent = (intent: string) =>
    window.open(intent, "_blank", "noopener,noreferrer");

  const shareFacebook = () =>
    openIntent(
      "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url),
    );
  const shareLinkedIn = () =>
    openIntent(
      "https://www.linkedin.com/sharing/share-offsite/?url=" +
        encodeURIComponent(url),
    );
  const shareInstagram = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "SCCA", text: t("shareText"), url });
      } catch {
        /* user dismissed the native sheet — no-op */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard blocked — the note still tells them the link */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 3000);
  };

  const base =
    "flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full font-heading text-sm font-extrabold text-white shadow-soft transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40 motion-safe:enabled:hover:-translate-y-0.5";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={shareInstagram}
          disabled={disabled}
          aria-label={t("shareInstagram")}
          className={`${base} focus-visible:ring-pink-500`}
          style={{
            background:
              "linear-gradient(45deg, #f9ce34, #ee2a7b 45%, #6228d7)",
          }}
        >
          <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.6">
            <rect x="2.5" y="2.5" width="15" height="15" rx="4.5" />
            <circle cx="10" cy="10" r="3.6" />
            <circle cx="14.2" cy="5.8" r="0.9" fill="#fff" stroke="none" />
          </svg>
        </button>
        <button
          type="button"
          onClick={shareFacebook}
          disabled={disabled}
          aria-label={t("shareFacebook")}
          className={`${base} focus-visible:ring-[#1877F2]`}
          style={{ background: "#1877F2" }}
        >
          f
        </button>
        <button
          type="button"
          onClick={shareLinkedIn}
          disabled={disabled}
          aria-label={t("shareLinkedin")}
          className={`${base} focus-visible:ring-[#0A66C2]`}
          style={{ background: "#0A66C2" }}
        >
          in
        </button>
      </div>
      {copied && (
        <p className="text-teal mt-2.5 text-xs" role="status">
          {t("shareCopied")}
        </p>
      )}
      {disabled && (
        <p className="text-gray-500 mt-2.5 text-[11.5px]">{t("shareLocked")}</p>
      )}
    </div>
  );
}
