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

  it("allows enough time for the hospital summary, PDF upload, and file message", () => {
    const submitSurvey = config.functions.find((fn) => fn.name === "submitSurvey");
    expect(submitSurvey?.timeout).toBeGreaterThanOrEqual(20);
  });

  it("pins cloud function SDKs to the audited runtime dependency set", () => {
    const packages = ["submitSurvey", "adminSurvey"].map((name) => JSON.parse(readFileSync(
      new URL(`../../functions/${name}/package.json`, import.meta.url),
      "utf8",
    )));
    for (const manifest of packages) {
      expect(manifest.dependencies["@cloudbase/node-sdk"]).toBe("3.18.5");
      if (manifest.name === "submit-survey-function") {
        expect(manifest.dependencies["form-data"]).toBe("4.0.6");
      }
      expect(manifest.overrides.axios).toBe("1.19.0");
      expect(manifest.overrides["lodash.set"]).toBe("npm:set-value@4.1.0");
      expect(manifest.overrides["lodash.unset"]).toBe("npm:unset-value@2.0.1");
    }
  });

  it("initializes CloudBase without repeating current-environment warnings", () => {
    for (const name of ["submitSurvey", "adminSurvey"]) {
      const source = readFileSync(
        new URL(`../../functions/${name}/src/index.ts`, import.meta.url),
        "utf8",
      );
      expect(source).toContain("const app = init({ env: SYMBOL_CURRENT_ENV });");
      expect(source).toContain("SYMBOL_CURRENT_ENV");
    }
  });

  it("builds static assets inside the isolated health-survey path", () => {
    expect(viteConfig.base).toBe("/health-survey/");
  });

  it("resolves independent paths and metadata for all brands", () => {
    expect(resolveBrandBase("hospital")).toBe("/health-survey/");
    expect(resolveBrandBase("hospital-female")).toBe("/women-health-survey/");
    expect(resolveBrandBase("nuoma-yuanyi")).toBe("/nuoma-yuanyi-survey/");
    expect(resolveBrandMetadata("hospital-female")).toMatchObject({
      title: "女性健康与功能状态问卷｜建始民族医院",
      description: "建始民族医院女性健康与功能状态问卷",
    });
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
