import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

const jsdomWindow = (
  globalThis as typeof globalThis & { jsdom?: { window: Window } }
).jsdom?.window;

// Node 26 exposes an experimental global localStorage getter. Vitest may keep
// that getter instead of installing JSDOM's storage, so pin tests to JSDOM.
if (jsdomWindow) {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: jsdomWindow.localStorage,
  });
}

if (typeof window !== "undefined") window.scrollTo = vi.fn();

if (typeof window !== "undefined") {
  Object.defineProperty(window, "scrollTo", { configurable: true, value: () => undefined });
  Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, value: () => undefined });
}

afterEach(() => {
  cleanup();
  if (typeof window !== "undefined") window.localStorage?.clear();
});
