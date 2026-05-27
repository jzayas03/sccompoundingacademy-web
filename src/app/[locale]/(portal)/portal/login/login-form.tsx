"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { signInWithEmailAction, type LoginState } from "./actions";

/**
 * Magic-link request form. Uses React 19 `useActionState` so the server
 * action can return inline error state without a manual round-trip — the
 * form is pre-disabled while pending, and a failure message renders
 * underneath the input until the next attempt.
 */
export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations("portal.login");
  const [state, action, pending] = useActionState<LoginState, FormData>(
    signInWithEmailAction,
    null,
  );

  return (
    <form action={action} className="mt-8 space-y-5">
      {/* Originating-locale travels with the form so the server action
          redirects to the matching verify page and the magic-link email
          renders in the user's chosen language. */}
      <input type="hidden" name="locale" value={locale} />
      <label className="block">
        <span className="font-heading text-teal-deep block text-sm font-semibold tracking-wide">
          {t("emailLabel")}
        </span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder={t("emailPlaceholder")}
          className="border-gray-300 focus-visible:border-teal-deep focus-visible:ring-teal-deep/20 mt-1.5 block w-full rounded-md border bg-white px-3 py-2.5 text-base text-gray-900 placeholder:text-gray-700/60 focus-visible:outline-none focus-visible:ring-4"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="bg-chartreuse text-teal-deep ring-teal-deep/15 shadow-soft hover:bg-chartreuse/95 hover:shadow-lift focus-visible:ring-chartreuse font-heading inline-flex h-12 w-full items-center justify-center rounded-md px-6 text-sm font-semibold ring-1 transition-[color,background-color,box-shadow,transform] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:text-base motion-safe:hover:-translate-y-px"
      >
        {pending ? t("submitting") : t("submit")}
      </button>

      {state?.error && (
        <p
          role="alert"
          className="border-gray-300 rounded-md border bg-white px-4 py-3 text-sm text-gray-900"
        >
          {t("errorBody")}
        </p>
      )}
    </form>
  );
}
