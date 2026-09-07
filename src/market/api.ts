import cloudbase from "@cloudbase/js-sdk";
import type {
  MarketUser,
  PatientHistory,
  PatientSummary,
  PreadmissionDraft,
  PreadmissionListItem,
  PreadmissionRecord,
} from "../domain/market-preadmission";

interface AuthLike {
  signInWithPassword(params: { username: string; password: string }): Promise<unknown>;
  resetPasswordForOld(params: { old_password: string; new_password: string }): Promise<unknown>;
  signOut(): Promise<unknown> | unknown;
  getSession(): Promise<unknown>;
}

export interface CloudBaseAppLike {
  auth(): AuthLike;
  callFunction(options: { name: string; data: Record<string, unknown> }): Promise<unknown>;
}

export interface MarketApi {
  restoreSession(): Promise<MarketUser | null>;
  login(username: string, password: string): Promise<MarketUser>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
  logout(): Promise<void>;
  searchPatients(query: string): Promise<PatientSummary[]>;
  getPatientHistory(patientId: string): Promise<PatientHistory>;
  createPreadmission(draft: PreadmissionDraft): Promise<PreadmissionRecord>;
  listPreadmissions(limit?: number): Promise<PreadmissionListItem[]>;
  retryNotification(recordId: string): Promise<PreadmissionRecord>;
}

export class MarketApiError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "MarketApiError";
  }
}

export const marketPasswordRuleMessage = "新密码需为 8–64 位，并包含大小写字母、数字和特殊字符";

export function isStrongMarketPassword(value: string) {
  return value.length >= 8
    && value.length <= 64
    && /^[\x21-\x7E]+$/.test(value)
    && /[A-Z]/.test(value)
    && /[a-z]/.test(value)
    && /\d/.test(value)
    && /[^A-Za-z0-9]/.test(value);
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function parseJson(value: unknown) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new MarketApiError("INVALID_RESPONSE", "服务器返回格式无效");
  }
}

export function parseFunctionResult(response: unknown): unknown {
  const envelope = objectValue(response);
  if (!envelope || !("result" in envelope)) throw new MarketApiError("EMPTY_RESPONSE", "服务器没有返回结果");
  const rawResult = parseJson(envelope.result);
  const wrapped = objectValue(rawResult);
  const payload = wrapped && "statusCode" in wrapped
    ? parseJson(wrapped.body)
    : rawResult;
  const body = objectValue(payload);
  if (!body) throw new MarketApiError("INVALID_RESPONSE", "服务器返回格式无效");
  const error = objectValue(body.error);
  if (error) {
    throw new MarketApiError(String(error.code ?? "REQUEST_FAILED"), String(error.message ?? "请求失败"));
  }
  if ("data" in body) return body.data;
  return body;
}

function authResultError(value: unknown) {
  const result = objectValue(value);
  if (!result?.error) return null;
  const error = objectValue(result.error);
  return new MarketApiError(
    String(error?.code ?? "LOGIN_FAILED"),
    "账号或密码不正确，请重新输入",
  );
}

function hasSession(value: unknown) {
  const result = objectValue(value);
  const data = objectValue(result?.data);
  return Boolean(data?.session || result?.session || result?.user);
}

export function createMarketApi(app: CloudBaseAppLike): MarketApi {
  const auth = app.auth();
  const call = async <T>(action: string, payload: Record<string, unknown> = {}) => {
    const response = await app.callFunction({ name: "marketPreadmission", data: { action, ...payload } });
    return parseFunctionResult(response) as T;
  };
  return {
    async restoreSession() {
      const sessionResult = await auth.getSession();
      const error = authResultError(sessionResult);
      if (error || !hasSession(sessionResult)) return null;
      try {
        return await call<MarketUser>("getSession");
      } catch (reason) {
        if (reason instanceof MarketApiError && ["AUTH_REQUIRED", "FORBIDDEN"].includes(reason.code)) return null;
        throw reason;
      }
    },

    async login(username, password) {
      const normalizedUsername = username.trim();
      if (!/^[A-Za-z0-9][A-Za-z0-9._:+@-]{4,23}$/.test(normalizedUsername)) {
        throw new MarketApiError("INVALID_USERNAME", "请输入正确的账号");
      }
      if (!password) throw new MarketApiError("INVALID_PASSWORD", "请输入密码");
      let loginResult: unknown;
      try {
        loginResult = await auth.signInWithPassword({ username: normalizedUsername, password });
      } catch {
        throw new MarketApiError("LOGIN_FAILED", "账号或密码不正确，请重新输入");
      }
      const loginError = authResultError(loginResult);
      if (loginError) throw loginError;
      try {
        return await call<MarketUser>("getSession");
      } catch (error) {
        await auth.signOut();
        throw error;
      }
    },

    async changePassword(oldPassword, newPassword) {
      if (!oldPassword) throw new MarketApiError("INVALID_OLD_PASSWORD", "请输入旧密码");
      if (newPassword === oldPassword) throw new MarketApiError("PASSWORD_UNCHANGED", "新密码不能与旧密码相同");
      if (!isStrongMarketPassword(newPassword)) throw new MarketApiError("WEAK_PASSWORD", marketPasswordRuleMessage);
      let changeResult: unknown;
      try {
        changeResult = await auth.resetPasswordForOld({
          old_password: oldPassword,
          new_password: newPassword,
        });
      } catch {
        throw new MarketApiError("PASSWORD_CHANGE_FAILED", "密码修改失败，请稍后重试");
      }
      const response = objectValue(changeResult);
      const error = objectValue(response?.error);
      if (!error) return;
      const code = String(error.code ?? error.error ?? "").toLowerCase();
      if (["invalid_password", "invalid_old_password", "wrong_password"].includes(code)) {
        throw new MarketApiError("INVALID_OLD_PASSWORD", "旧密码不正确，请重新输入");
      }
      if (code.includes("weak") || code.includes("password_too_weak")) {
        throw new MarketApiError("WEAK_PASSWORD", marketPasswordRuleMessage);
      }
      throw new MarketApiError("PASSWORD_CHANGE_FAILED", "密码修改失败，请稍后重试");
    },

    async logout() {
      await auth.signOut();
    },

    searchPatients(query) {
      return call<PatientSummary[]>("searchPatients", { query });
    },

    getPatientHistory(patientId) {
      return call<PatientHistory>("getPatientHistory", { patientId });
    },

    createPreadmission(draft) {
      return call<PreadmissionRecord>("createPreadmission", { draft });
    },

    listPreadmissions(limit = 30) {
      return call<PreadmissionListItem[]>("listPreadmissions", { limit });
    },

    retryNotification(recordId) {
      return call<PreadmissionRecord>("retryNotification", { recordId });
    },
  };
}

export function createDefaultMarketApi() {
  const env = import.meta.env.VITE_CLOUDBASE_ENV_ID?.trim();
  const accessKey = import.meta.env.VITE_CLOUDBASE_ACCESS_KEY?.trim();
  if (!env || !accessKey) {
    throw new MarketApiError("CONFIG_REQUIRED", "系统尚未完成 CloudBase 登录配置，请联系管理员");
  }
  const app = cloudbase.init({ env, region: "ap-shanghai", accessKey });
  return createMarketApi(app as unknown as CloudBaseAppLike);
}
