// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import config from "../../cloudbaserc.json";
import viteConfig from "../../vite.config";

describe("CloudBase function configuration", () => {
  it("deploys event handlers behind SCF gateway routes", () => {
    expect(config.functions.map((fn) => fn.type)).toEqual(["Event", "Event"]);
    expect(config.functions.map((fn) => fn.handler)).toEqual(["index.main", "index.main"]);
  });

  it("builds static assets inside the isolated health-survey path", () => {
    expect(viteConfig.base).toBe("/health-survey/");
  });

  it("passes documents directly to the server-side CloudBase SDK", () => {
    const submitSource = readFileSync(new URL("../../functions/submitSurvey/src/index.ts", import.meta.url), "utf8");
    const adminSource = readFileSync(new URL("../../functions/adminSurvey/src/index.ts", import.meta.url), "utf8");
    expect(submitSource).not.toContain(".add({ data:");
    expect(adminSource).not.toContain(".add({ data:");
  });
});
