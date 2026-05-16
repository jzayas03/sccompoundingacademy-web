"use client";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";

type Item = { q: string; a: string };

export function Accordion({ items, className }: { items: Item[]; className?: string }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const id = useId();
  return (
    <ul className={cn("divide-teal-deep/10 divide-y", className)}>
      {items.map((item, idx) => {
        const open = openIdx === idx;
        const panelId = `${id}-panel-${idx}`;
        const btnId = `${id}-btn-${idx}`;
        return (
          <li key={idx}>
            <button
              id={btnId}
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenIdx(open ? null : idx)}
              className="font-heading text-teal-deep flex w-full items-center justify-between gap-4 py-5 text-left text-lg font-semibold"
            >
              <span>{item.q}</span>
              <span aria-hidden className={cn("transition-transform", open && "rotate-45")}>
                +
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              hidden={!open}
              className="pb-5 text-base text-gray-900"
            >
              {item.a}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
