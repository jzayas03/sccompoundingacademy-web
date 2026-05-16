"use client";
import { useEffect, useRef, useState } from "react";
import manifest from "../../../public/hero/mortar/manifest.json";

type Manifest = { frameCount: number; width: number; height: number; frames: string[] };

const M = manifest as Manifest;

export function HeroMortar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const currentFrameRef = useRef(0);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0]));
  const inViewRef = useRef(false);

  // Respect prefers-reduced-motion: render frame in the middle and stop.
  const [reduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  // Progressive preload at scroll-progress 25/50/75% first, then fill.
  useEffect(() => {
    if (reduced) return;
    const order: number[] = [];
    const last = M.frameCount - 1;
    for (const pct of [0.25, 0.5, 0.75]) order.push(Math.round(pct * last));
    for (let i = 0; i < M.frameCount; i++) if (!order.includes(i)) order.push(i);
    let cancelled = false;
    (async () => {
      for (const idx of order) {
        if (cancelled) return;
        await preloadFrame(idx);
        setLoaded((prev) => {
          if (prev.has(idx)) return prev;
          const next = new Set(prev);
          next.add(idx);
          return next;
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reduced]);

  // IntersectionObserver: pause when hero leaves viewport.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      inViewRef.current = entry?.isIntersecting ?? false;
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // rAF scroll-driven scrub.
  useEffect(() => {
    if (reduced) {
      const mid = Math.floor(M.frameCount / 2);
      if (imgRef.current && M.frames[mid]) imgRef.current.src = M.frames[mid];
      return;
    }
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!inViewRef.current) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight;
      // 0 when hero top hits viewport top; 1 when hero bottom leaves viewport top.
      const progress = Math.min(1, Math.max(0, (viewport - rect.top) / (viewport + rect.height)));
      const target = Math.min(
        M.frameCount - 1,
        Math.max(0, Math.floor(progress * (M.frameCount - 1))),
      );
      if (
        target !== currentFrameRef.current &&
        loaded.has(target) &&
        imgRef.current &&
        M.frames[target]
      ) {
        imgRef.current.src = M.frames[target];
        currentFrameRef.current = target;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [loaded, reduced]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 select-none sm:block"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- src swap per frame; next/image not suitable for scroll-scrub */}
      <img
        ref={imgRef}
        src={M.frames[0]}
        alt=""
        aria-hidden
        width={M.width}
        height={M.height}
        decoding="async"
        fetchPriority="low"
        className="absolute inset-0 m-auto h-full w-full object-contain"
      />
    </div>
  );
}

function preloadFrame(idx: number): Promise<void> {
  return new Promise((resolve) => {
    const url = M.frames[idx];
    if (!url) return resolve();
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}
