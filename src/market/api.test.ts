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
      auth: () => ({ signInWithPassword, signOut: vi.fn(), getSession: vi.fn(), resetPasswordForOld: vi.fn() }),
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
        resetPasswordForOld: vi.fn(),
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
        resetPasswordForOld: vi.fn(),
      }),
      callFunction: vi.fn(),
    });
    await expect(api.restoreSession()).resolves.toBeNull();
  });

  it("changes the current user's password with the old password", async () => {
    const resetPasswordForOld = vi.fn().mockResolvedValue({ data: { session: {} }, error: null });
    const api = createMarketApi({
      auth: () => ({ signInWithPassword: vi.fn(), signOut: vi.fn(), getSession: vi.fn(), resetPasswordForOld }),
      callFunction: vi.fn(),
    });

    await expect(api.changePassword("OldPass1!", "NewPass2@")).resolves.toBeUndefined();
    expect(resetPasswordForOld).toHaveBeenCalledWith({ old_password: "OldPass1!", new_password: "NewPass2@" });
  });

  it("maps an invalid old password to a safe Chinese error", async () => {
    const resetPasswordForOld = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "invalid_password", message: "provider detail" },
    });
    const api = createMarketApi({
      auth: () => ({ signInWithPassword: vi.fn(), signOut: vi.fn(), getSession: vi.fn(), resetPasswordForOld }),
      callFunction: vi.fn(),
    });

    await expect(api.changePassword("WrongPass1!", "NewPass2@")).rejects.toMatchObject({
      code: "INVALID_OLD_PASSWORD",
      message: "旧密码不正确，请重新输入",
    });
  });

  it("maps weak-password and network failures without leaking provider details", async () => {
    const weakPassword = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "password_too_weak", message: "provider detail" },
    });
    const weakApi = createMarketApi({
      auth: () => ({ signInWithPassword: vi.fn(), signOut: vi.fn(), getSession: vi.fn(), resetPasswordForOld: weakPassword }),
      callFunction: vi.fn(),
    });
    await expect(weakApi.changePassword("OldPass1!", "weak")).rejects.toMatchObject({
      code: "WEAK_PASSWORD",
      message: "新密码需为 8–64 位，并包含大小写字母、数字和特殊字符",
    });

    const networkFailure = vi.fn().mockRejectedValue(new Error("request carried a secret"));
    const networkApi = createMarketApi({
      auth: () => ({ signInWithPassword: vi.fn(), signOut: vi.fn(), getSession: vi.fn(), resetPasswordForOld: networkFailure }),
      callFunction: vi.fn(),
    });
    await expect(networkApi.changePassword("OldPass1!", "NewPass2@")).rejects.toMatchObject({
      code: "PASSWORD_CHANGE_FAILED",
      message: "密码修改失败，请稍后重试",
    });
  });
});
