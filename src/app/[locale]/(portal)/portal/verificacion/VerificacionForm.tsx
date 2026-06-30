"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { upload } from "@vercel/blob/client";
import {
  VERIFICATION_ACCEPTED_TYPES,
  VERIFICATION_MAX_BYTES,
  VERIFICATION_BLOB_PREFIX,
} from "@/lib/portal/verification";
import { submitVerificationDoc } from "./actions";

export function VerificacionForm() {
  const t = useTranslations("portal.verificacion");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    if (!VERIFICATION_ACCEPTED_TYPES.includes(file.type as never)) {
      setError(t("errorType"));
      return;
    }
    if (file.size > VERIFICATION_MAX_BYTES) {
      setError(t("errorSize"));
      return;
    }

    setBusy(true);
    try {
      const blob = await upload(`${VERIFICATION_BLOB_PREFIX}/${file.name}`, file, {
        // Private store — identity document, viewed by the admin via signed URL.
        access: "private",
        handleUploadUrl: "/api/portal/verificacion/upload",
      });
      await submitVerificationDoc(blob.url);
      router.refresh();
    } catch {
      setError(t("errorUpload"));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <input
        ref={inputRef}
        type="file"
        required
        accept={VERIFICATION_ACCEPTED_TYPES.join(",")}
        className="block w-full text-sm text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-teal-deep file:px-4 file:py-2 file:text-sm file:font-semibold file:text-off-white hover:file:bg-teal"
      />
      <p className="text-gray-700 text-xs">{t("instructions")}</p>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="bg-chartreuse text-teal-deep focus-visible:ring-chartreuse font-heading inline-flex h-11 items-center rounded-md px-5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
      >
        {busy ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
