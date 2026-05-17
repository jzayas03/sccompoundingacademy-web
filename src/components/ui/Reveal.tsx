"use client";
import { useEffect, useRef, useState, type ElementType } from "react";
import { cn } from "@/lib/cn";

/**
 * Reveal — a tiny client wrapper that fades + lifts its children into
 * view when they enter the viewport.
 *
 *   - Starts at `opacity-0 translate-y-3`
 *   - Transitions to `opacity-100 translate-y-0` over 700ms ease-out
 *   - One-shot: stops observing after the first reveal (no scroll-out
 *     re-hide; we never want elements to fade out as you scroll past)
 *   - Respects `prefers-reduced-motion`: skips the animation entirely
 *     and renders in the visible state immediately
 *
 * Use INSIDE a section's <Container>, not wrapping the section itself,
 * so the section background stays anchored and only the content fades up.
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  // Lazy initializer — if the user prefers reduced motion, start as visible.
  // Doing this in the initial state (vs. a useEffect setState) avoids the
  // react-hooks/set-state-in-effect lint rule and renders the final visual
  // state on first paint (no flash of opacity-0 for reduced-motion users).
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    // If we're already visible (reduced motion path), no observer needed.
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return (
    <Tag
      ref={ref as never}
      className={cn(
        "motion-reduce:!opacity-100 motion-reduce:!translate-y-0 motion-reduce:!transition-none transition-[opacity,transform] duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
