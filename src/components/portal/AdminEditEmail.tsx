"use client";

import { useActionState, useState } from "react";
import {
  updateUserEmail,
  type EditEmailState,
} from "@/app/[locale]/(portal)/portal/admin/actions";

/**
 * Inline "edit email" control for one roster row in the admin panel.
 *
 * Collapsed: shows the email + an "editar" link. Expanded: an email input
 * + Guardar/Cancelar, wired to the `updateUserEmail` server action via
 * `useActionState` so success/error feedback renders in place. On success
 * the server revalidates the admin page (the row re-queries with the new
 * email) and we collapse the editor.
 */
const INITIAL: EditEmailState = { ok: false, message: "" };

export function AdminEditEmail({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateUserEmail,
    INITIAL,
  );

  // Collapse the editor the render a change lands successfully. Adjusting
  // state during render (vs. in an effect) is the React-recommended pattern
  // and avoids a cascading re-render; `useActionState` returns a fresh
  // `state` object per result, so the identity check fires once per change.
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.ok && state.message) setEditing(false);
  }

  if (!editing) {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-gray-700">{email}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-teal-deep hover:text-teal text-xs font-semibold underline underline-offset-2"
        >
          editar
        </button>
        {state.message && (
          <span
            className={`text-xs ${state.ok ? "text-teal-deep" : "text-red-700"}`}
          >
            {state.message}
          </span>
        )}
      </span>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input
        name="email"
        type="email"
        defaultValue={email}
        required
        autoFocus
        className="border-gray-300 focus-visible:ring-chartreuse w-56 rounded-md border px-2 py-1 text-sm focus-visible:ring-2 focus-visible:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-teal-deep text-off-white hover:bg-teal disabled:opacity-60 rounded-md px-3 py-1 text-xs font-semibold"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-gray-700 hover:text-gray-900 px-2 py-1 text-xs font-semibold"
      >
        Cancelar
      </button>
      {state.message && !state.ok && (
        <span className="text-red-700 w-full text-xs">{state.message}</span>
      )}
    </form>
  );
}
