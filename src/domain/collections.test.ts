import { describe, expect, it } from "vitest";
import { collections } from "./collections";

describe("CloudBase collection namespace", () => {
  it("uses a project-specific prefix to avoid existing environment data", () => {
    expect(Object.values(collections).every((name) => name.startsWith("health_"))).toBe(true);
    expect(new Set(Object.values(collections)).size).toBe(5);
  });
});

