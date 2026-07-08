"use client";

import { useActionState, useState } from "react";
import {
  changeCohort,
  type ChangeCohortState,
} from "@/app/[locale]/(portal)/portal/admin/actions";

/**
 * Inline "change cohort" control for one roster row in the admin panel.
 *
 * Collapsed: the student's current cohort label + a "cambiar" button (hidden
 * when there is no other compatible cohort to move into). Expanded: a select
 * of audience-compatible destination cohorts (full ones flagged "· llena"), a
 * "forzar" checkbox that lets the move bypass a full destination's capacity,
 * and Guardar/Cancelar. Wired to the `changeCohort` server action via
 * `useActionState`; on success the server revalidates the admin page (the row
 * re-queries with the new cohort) and we collapse the editor.
 */
type Option = { id: string; label: string; full: boolean; remaining: number };

const INITIAL: ChangeCohortState = { ok: false, message: "" };

export function AdminChangeCohort({
  userId,
  currentLabel,
  options,
}: {
  userId: string;
  currentLabel: string;
  options: Option[];
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(changeCohort, INITIAL);

  // Collapse once a change lands successfully. Adjusting state during render
  // (vs. an effect) is the React-recommended pattern; `useActionState` returns
  // a fresh `state` object per result so the identity check fires once.
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.ok && state.message) setEditing(false);
  }

  if (!editing) {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-gray-700">{currentLabel}</span>
        {options.length > 0 && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-teal-deep hover:text-teal text-xs font-semibold underline underline-offset-2"
          >
            cambiar
          </button>
        )}
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
      <select
        name="cohortId"
        defaultValue={options[0]?.id}
        className="border-gray-300 focus-visible:ring-chartreuse rounded-md border bg-white px-2 py-1 text-sm text-gray-900 focus-visible:ring-2 focus-visible:outline-none"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
            {o.full ? " · llena" : ` · ${o.remaining} cupos`}
          </option>
        ))}
      </select>
      <label className="text-gray-700 inline-flex items-center gap-1 text-xs">
        <input type="checkbox" name="force" className="accent-teal-deep" />
        Forzar aunque esté llena
      </label>
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
