// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import config from "../../cloudbaserc.json";
import viteConfig, { resolveBrandBase, resolveBrandMetadata } from "../../vite.config";

describe("CloudBase function configuration", () => {
  it("deploys event handlers behind SCF gateway routes", () => {
    expect(config.functions.map((fn) => fn.type)).toEqual(["Event", "Event"]);
    expect(config.functions.map((fn) => fn.handler)).toEqual(["index.main", "index.main"]);
    expect(config.functions.some((fn) => "envVariables" in fn)).toBe(false);
  });

  it("builds static assets inside the isolated health-survey path", () => {
    expect(viteConfig.base).toBe("/health-survey/");
  });

  it("resolves independent paths and metadata for both brands", () => {
    expect(resolveBrandBase("hospital")).toBe("/health-survey/");
    expect(resolveBrandBase("nuoma-yuanyi")).toBe("/nuoma-yuanyi-survey/");
    expect(resolveBrandMetadata("nuoma-yuanyi")).toMatchObject({
      title: "健康与功能状态问卷｜诺玛元一",
      description: "诺玛元一健康与功能状态问卷",
    });
    expect(() => resolveBrandBase("unknown")).toThrow("未知问卷品牌");
  });

  it("passes documents directly to the server-side CloudBase SDK", () => {
    const submitSource = readFileSync(new URL("../../functions/submitSurvey/src/index.ts", import.meta.url), "utf8");
    const adminSource = readFileSync(new URL("../../functions/adminSurvey/src/index.ts", import.meta.url), "utf8");
    expect(submitSource).not.toContain(".add({ data:");
    expect(adminSource).not.toContain(".add({ data:");
    expect(submitSource).toContain("DEFAULT_ALLOWED_ORIGIN");
  });
});
