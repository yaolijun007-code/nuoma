// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseMarketRequest } from "./request";

describe("market function request parser", () => {
  it("accepts direct event payloads from callFunction", () => {
    expect(parseMarketRequest({ action: "searchPatients", query: "张三" })).toEqual({ action: "searchPatients", query: "张三" });
  });

  it("accepts JSON bodies from an HTTP compatibility route", () => {
    expect(parseMarketRequest({ body: '{"action":"getSession"}' })).toEqual({ action: "getSession" });
  });

  it("rejects missing and unknown actions", () => {
    expect(() => parseMarketRequest({})).toThrow("操作类型无效");
    expect(() => parseMarketRequest({ action: "deletePatient" })).toThrow("操作类型无效");
  });
});
