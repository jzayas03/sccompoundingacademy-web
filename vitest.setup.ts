import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom doesn't implement matchMedia — components like Reveal use it to
// detect prefers-reduced-motion. Stub it so any component render works
// under jsdom without every test having to mock it individually.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// jsdom also doesn't implement IntersectionObserver — stub it for the same
// reason (Reveal uses it to trigger the fade-in on scroll into view).
if (typeof window !== "undefined" && !("IntersectionObserver" in window)) {
  class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  // @ts-expect-error - partial mock, sufficient for jsdom test rendering
  window.IntersectionObserver = MockIntersectionObserver;
  // @ts-expect-error - mirror onto global for code that reads the bare global
  global.IntersectionObserver = MockIntersectionObserver;
}

afterEach(() => {
  cleanup();
});
