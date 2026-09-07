import { describe, expect, it, vi } from "vitest";
import { MarketApiError, createMarketApi, parseFunctionResult } from "./api";

describe("market CloudBase API", () => {
  it("parses wrapped cloud function success results", () => {
    expect(parseFunctionResult({
      result: { statusCode: 200, body: JSON.stringify({ data: { ok: true } }) },
    })).toEqual({ ok: true });
  });

  it("throws stable API errors from wrapped error results", () => {
    expect(() => parseFunctionResult({
      result: { statusCode: 403, body: JSON.stringify({ error: { code: "FORBIDDEN", message: "无权限" } }) },
    })).toThrowError(MarketApiError);
    try {
      parseFunctionResult({ result: { statusCode: 403, body: JSON.stringify({ error: { code: "FORBIDDEN", message: "无权限" } }) } });
    } catch (error) {
      expect(error).toMatchObject({ code: "FORBIDDEN", message: "无权限" });
    }
  });

  it("rejects malformed function responses", () => {
    expect(() => parseFunctionResult({ result: { statusCode: 200, body: "not-json" } })).toThrow("服务器返回格式无效");
    expect(() => parseFunctionResult({})).toThrow("服务器没有返回结果");
  });

  it("uses password login and then verifies the server-side role", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ data: { user: { id: "uid-market" } }, error: null });
    const callFunction = vi.fn().mockResolvedValue({
      result: { statusCode: 200, body: JSON.stringify({ data: { uid: "uid-market", username: "sc001", displayName: "市场一组", role: "market" } }) },
    });
    const api = createMarketApi({
      auth: () => ({ signInWithPassword, signOut: vi.fn(), getSession: vi.fn() }),
      callFunction,
    });
    await expect(api.login("sc001", "strong-password")).resolves.toMatchObject({ uid: "uid-market" });
    expect(signInWithPassword).toHaveBeenCalledWith({ username: "sc001", password: "strong-password" });
    expect(callFunction).toHaveBeenCalledWith({ name: "marketPreadmission", data: { action: "getSession" } });
  });

  it("signs out a valid login when the user lacks a market role", async () => {
    const signOut = vi.fn();
    const api = createMarketApi({
      auth: () => ({
        signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
        signOut,
        getSession: vi.fn(),
      }),
      callFunction: vi.fn().mockResolvedValue({
        result: { statusCode: 403, body: JSON.stringify({ error: { code: "FORBIDDEN", message: "账号未授权或已停用" } }) },
      }),
    });
    await expect(api.login("sc002", "strong-password")).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("returns no restored session for unauthenticated users", async () => {
    const api = createMarketApi({
      auth: () => ({
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      }),
      callFunction: vi.fn(),
    });
    await expect(api.restoreSession()).resolves.toBeNull();
  });
});
