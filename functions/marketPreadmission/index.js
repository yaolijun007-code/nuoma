var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// functions/marketPreadmission/src/index.ts
var index_exports = {};
__export(index_exports, {
  main: () => main
});
module.exports = __toCommonJS(index_exports);
var import_node_sdk = require("@cloudbase/node-sdk");

// src/domain/market-preadmission.ts
var contactResults = {
  patient_interested: "\u60A3\u8005\u672C\u4EBA\u6709\u610F\u613F",
  family_interested: "\u5BB6\u5C5E\u6709\u610F\u613F",
  considering: "\u6B63\u5728\u8003\u8651",
  no_answer: "\u6682\u672A\u63A5\u901A",
  declined: "\u6682\u4E0D\u8003\u8651",
  other: "\u5176\u4ED6"
};
var allowedContactResults = new Set(Object.keys(contactResults));
function safeInline(value, limit = 120) {
  return String(value ?? "").replace(/[\r\n<>`\[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}
function normalizePatientQuery(raw) {
  const value = String(raw ?? "").trim();
  const digits = value.replace(/\s+/g, "");
  if (/^1\d{10}$/.test(digits)) return { kind: "phone", value: digits };
  if (/^\d{5,20}$/.test(digits)) return { kind: "hospitalNo", value: digits };
  if (/^[\p{Script=Han}·]{2,30}$/u.test(value)) return { kind: "name", value };
  if (/^[A-Za-z][A-Za-z0-9_-]{0,31}$/.test(value)) return { kind: "patientId", value: value.toUpperCase() };
  if (value.length < 2) throw new Error("\u81F3\u5C11\u8F93\u5165 2 \u4E2A\u5B57");
  throw new Error("\u8BF7\u8F93\u5165\u6B63\u786E\u7684\u60A3\u8005\u59D3\u540D\u3001\u624B\u673A\u53F7\u6216\u4F4F\u9662\u53F7");
}
function requiredText(value, label, max) {
  const normalized = safeInline(value, max + 1);
  if (!normalized) throw new Error(`\u8BF7\u586B\u5199${label}`);
  if (normalized.length > max) throw new Error(`${label}\u4E0D\u80FD\u8D85\u8FC7 ${max} \u4E2A\u5B57`);
  return normalized;
}
function optionalText(value, label, max) {
  const normalized = safeInline(value, max + 1);
  if (normalized.length > max) throw new Error(`${label}\u4E0D\u80FD\u8D85\u8FC7 ${max} \u4E2A\u5B57`);
  return normalized;
}
function validIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = /* @__PURE__ */ new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function validatePreadmissionDraft(input) {
  const clientSubmissionId = String(input?.clientSubmissionId ?? "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientSubmissionId)) {
    throw new Error("\u63D0\u4EA4\u6807\u8BC6\u65E0\u6548\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5");
  }
  const patientId = requiredText(input?.patientId, "\u60A3\u8005\u6807\u8BC6", 64);
  const contactPhone = String(input?.contactPhone ?? "").replace(/\s+/g, "").trim();
  if (!/^[0-9+()\-]{5,30}$/.test(contactPhone)) throw new Error("\u8054\u7CFB\u65B9\u5F0F\u683C\u5F0F\u4E0D\u6B63\u786E");
  const plannedAdmissionDate = String(input?.plannedAdmissionDate ?? "").trim();
  if (!plannedAdmissionDate) throw new Error("\u8BF7\u9009\u62E9\u8BA1\u5212\u4F4F\u9662\u65E5\u671F");
  if (!validIsoDate(plannedAdmissionDate)) throw new Error("\u8BA1\u5212\u4F4F\u9662\u65E5\u671F\u683C\u5F0F\u4E0D\u6B63\u786E");
  const intendedDepartment = requiredText(input?.intendedDepartment, "\u62DF\u5165\u79D1\u5BA4", 60);
  const mainProblem = requiredText(input?.mainProblem, "\u4E3B\u8981\u95EE\u9898", 500);
  const contactResult = String(input?.contactResult ?? "");
  if (!allowedContactResults.has(contactResult)) throw new Error("\u8BF7\u9009\u62E9\u8054\u7CFB\u7ED3\u679C");
  const notes = optionalText(input?.notes, "\u5907\u6CE8", 500);
  return {
    clientSubmissionId,
    patientId,
    contactPhone,
    plannedAdmissionDate,
    intendedDepartment,
    mainProblem,
    contactResult,
    notes
  };
}
function shortDate(value) {
  if (!value || !validIsoDate(value)) return "\u65E5\u671F\u672A\u8BB0\u5F55";
  return `${value.slice(5, 7)}\u6708${value.slice(8, 10)}\u65E5`;
}
function shanghaiDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "\u65F6\u95F4\u5F85\u6838\u5B9E";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}
function buildPreadmissionMarkdown(model) {
  const latestStay = model.latestAdmissionDate ? `${shortDate(model.latestAdmissionDate)} \u81F3 ${shortDate(model.latestDischargeDate)}` : "\u65E0\u53EF\u7528\u8BB0\u5F55";
  const age = Number.isInteger(model.age) && Number(model.age) >= 0 ? `${model.age} \u5C81` : "\u5E74\u9F84\u672A\u8BB0\u5F55";
  return [
    "### \u5EFA\u59CB\u6C11\u65CF\u533B\u9662\uFF5C\u9884\u4F4F\u9662\u767B\u8BB0",
    "",
    `**\u767B\u8BB0\u7F16\u53F7**\uFF1A${safeInline(model.recordId, 40)}`,
    `**\u60A3\u8005\u59D3\u540D**\uFF1A${safeInline(model.patientName, 40)}`,
    `**\u8054\u7CFB\u7535\u8BDD**\uFF1A${safeInline(model.contactPhone, 30)}`,
    `**\u57FA\u672C\u4FE1\u606F**\uFF1A${safeInline(model.sex, 10) || "\u672A\u8BB0\u5F55"}\uFF5C${age}`,
    `**\u65E2\u5F80\u4F4F\u9662**\uFF1A${Math.max(0, Math.floor(Number(model.admissionCount) || 0))} \u6B21\uFF5C\u6700\u8FD1 ${latestStay}`,
    "",
    `**\u8BA1\u5212\u4F4F\u9662\u65E5\u671F**\uFF1A${safeInline(model.plannedAdmissionDate, 10)}`,
    `**\u62DF\u5165\u79D1\u5BA4**\uFF1A${safeInline(model.intendedDepartment, 60)}`,
    `**\u4E3B\u8981\u95EE\u9898**\uFF1A${safeInline(model.mainProblem, 500)}`,
    `**\u8054\u7CFB\u7ED3\u679C**\uFF1A${contactResults[model.contactResult] || "\u5176\u4ED6"}`,
    "",
    `**\u767B\u8BB0\u4EBA\u5458**\uFF1A${safeInline(model.createdByName, 40)}`,
    `**\u767B\u8BB0\u65F6\u95F4**\uFF1A${shanghaiDateTime(model.createdAt)}`,
    "**\u5F53\u524D\u72B6\u6001**\uFF1A\u9884\u4F4F\u9662\u7EBF\u7D22\uFF0C\u5F85\u533B\u52A1\u4EBA\u5458\u786E\u8BA4"
  ].join("\n");
}

// functions/marketPreadmission/src/service.ts
var MarketServiceError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "MarketServiceError";
  }
  code;
};
function defaultRecordId(now) {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `PY-${date}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}
function auditNow(clock) {
  return clock().toISOString();
}
function searchAuditDetail(kind, value) {
  if (kind === "phone") return `phone:*${value.slice(-4)}`;
  if (kind === "hospitalNo") return `hospitalNo:*${value.slice(-4)}`;
  if (kind === "name") return `name:length-${[...value].length}`;
  return `patientId:*${value.slice(-4)}`;
}
function safeDeliveryCode(error) {
  if (error && typeof error === "object" && "code" in error) {
    const code = String(error.code ?? "");
    if (/^[A-Z0-9_]{2,50}$/.test(code)) return code;
  }
  return "DELIVERY_FAILED";
}
function messageModel(record) {
  return {
    recordId: record.recordId,
    patientName: record.patientName,
    contactPhone: record.contactPhone,
    sex: record.patientSnapshot.sex,
    age: record.patientSnapshot.age,
    admissionCount: record.patientSnapshot.admissionCount,
    latestAdmissionDate: record.patientSnapshot.latestAdmissionDate,
    latestDischargeDate: record.patientSnapshot.latestDischargeDate,
    plannedAdmissionDate: record.plannedAdmissionDate,
    intendedDepartment: record.intendedDepartment,
    mainProblem: record.mainProblem,
    contactResult: record.contactResult,
    createdByName: record.createdByName,
    createdAt: record.createdAt
  };
}
function createMarketPreadmissionService(repository2, notifier, clock = () => /* @__PURE__ */ new Date(), createRecordId = defaultRecordId) {
  const authorize = async (uid) => {
    if (!uid) throw new MarketServiceError("AUTH_REQUIRED", "\u8BF7\u5148\u767B\u5F55");
    const user = await repository2.findActiveUser(uid);
    if (!user) throw new MarketServiceError("FORBIDDEN", "\u8D26\u53F7\u672A\u6388\u6743\u6216\u5DF2\u505C\u7528");
    return user;
  };
  const notify = async (record) => {
    if (record.notificationStatus === "sent") return record;
    const now = auditNow(clock);
    const attempt = record.notificationAttempts + 1;
    try {
      const model = messageModel(record);
      const result = await notifier.send(model, buildPreadmissionMarkdown(model));
      const updated = await repository2.updateNotification(record.recordId, {
        notificationStatus: result.status,
        notificationAttempts: attempt,
        lastNotificationAt: now,
        lastNotificationErrorCode: "",
        updatedAt: now
      });
      await repository2.writeNotificationLog({
        recordId: record.recordId,
        attempt,
        status: result.status,
        responseCode: result.responseCode,
        createdAt: now
      });
      return updated;
    } catch (error) {
      const errorCode = safeDeliveryCode(error);
      const updated = await repository2.updateNotification(record.recordId, {
        notificationStatus: "failed",
        notificationAttempts: attempt,
        lastNotificationAt: now,
        lastNotificationErrorCode: errorCode,
        updatedAt: now
      });
      await repository2.writeNotificationLog({ recordId: record.recordId, attempt, status: "failed", errorCode, createdAt: now });
      return updated;
    }
  };
  return {
    async getSession(uid) {
      const user = await authorize(uid);
      await repository2.writeAudit({
        uid,
        action: "session_get",
        targetType: "user",
        targetId: uid,
        result: "success",
        createdAt: auditNow(clock)
      });
      return user;
    },
    async searchPatients(uid, rawQuery) {
      await authorize(uid);
      const query = normalizePatientQuery(rawQuery);
      const patients = await repository2.searchPatients(query, 20);
      await repository2.writeAudit({
        uid,
        action: "patient_search",
        targetType: "patient",
        targetId: "search",
        result: "success",
        detail: searchAuditDetail(query.kind, query.value),
        createdAt: auditNow(clock)
      });
      return patients;
    },
    async getPatientHistory(uid, rawPatientId) {
      await authorize(uid);
      const patientId = String(rawPatientId ?? "").trim();
      if (!patientId || patientId.length > 64) throw new MarketServiceError("INVALID_INPUT", "\u60A3\u8005\u6807\u8BC6\u65E0\u6548");
      const history = await repository2.getPatientHistory(patientId);
      await repository2.writeAudit({
        uid,
        action: "patient_history_view",
        targetType: "patient",
        targetId: patientId,
        result: history ? "success" : "not_found",
        createdAt: auditNow(clock)
      });
      if (!history) throw new MarketServiceError("PATIENT_NOT_FOUND", "\u672A\u627E\u5230\u60A3\u8005\u8BB0\u5F55");
      return history;
    },
    async createPreadmission(uid, rawDraft) {
      const user = await authorize(uid);
      let draft;
      try {
        draft = validatePreadmissionDraft(rawDraft);
      } catch (error) {
        throw new MarketServiceError("INVALID_INPUT", error instanceof Error ? error.message : "\u767B\u8BB0\u5185\u5BB9\u65E0\u6548");
      }
      const existing = await repository2.findPreadmissionBySubmissionId(draft.clientSubmissionId);
      if (existing) {
        if (existing.createdByUid !== uid && user.role !== "admin") throw new MarketServiceError("FORBIDDEN", "\u63D0\u4EA4\u6807\u8BC6\u5DF2\u88AB\u4F7F\u7528");
        await repository2.writeAudit({
          uid,
          action: "preadmission_create",
          targetType: "preadmission",
          targetId: existing.recordId,
          result: "duplicate",
          createdAt: auditNow(clock)
        });
        return existing.notificationStatus === "sent" ? existing : notify(existing);
      }
      const history = await repository2.getPatientHistory(draft.patientId);
      if (!history) throw new MarketServiceError("PATIENT_NOT_FOUND", "\u672A\u627E\u5230\u60A3\u8005\u8BB0\u5F55");
      const now = clock();
      const createdAt = now.toISOString();
      const record = {
        recordId: createRecordId(now),
        clientSubmissionId: draft.clientSubmissionId,
        patientId: draft.patientId,
        patientName: history.patient.name,
        patientSnapshot: {
          patientCode: history.patient.patientCode,
          hospitalNo: history.patient.hospitalNo,
          sex: history.patient.sex,
          age: history.patient.age,
          admissionCount: history.patient.admissionCount,
          latestAdmissionDate: history.patient.latestAdmissionDate,
          latestDischargeDate: history.patient.latestDischargeDate
        },
        contactPhone: draft.contactPhone,
        plannedAdmissionDate: draft.plannedAdmissionDate,
        intendedDepartment: draft.intendedDepartment,
        mainProblem: draft.mainProblem,
        contactResult: draft.contactResult,
        notes: draft.notes,
        createdByUid: uid,
        createdByName: user.displayName,
        createdAt,
        updatedAt: createdAt,
        notificationStatus: "pending",
        notificationAttempts: 0
      };
      const saved = await repository2.createPreadmission(record);
      await repository2.writeAudit({
        uid,
        action: "preadmission_create",
        targetType: "preadmission",
        targetId: saved.recordId,
        result: "success",
        createdAt
      });
      return notify(saved);
    },
    async listPreadmissions(uid, requestedLimit = 30) {
      const user = await authorize(uid);
      const limit = Math.max(1, Math.min(100, Number(requestedLimit) || 30));
      const records = await repository2.listPreadmissions(user.role === "admin" ? null : uid, limit);
      await repository2.writeAudit({
        uid,
        action: "preadmission_list",
        targetType: "preadmission",
        targetId: user.role === "admin" ? "all" : uid,
        result: "success",
        createdAt: auditNow(clock)
      });
      return records;
    },
    async retryNotification(uid, recordId) {
      const user = await authorize(uid);
      const record = await repository2.getPreadmission(String(recordId ?? "").trim());
      if (!record) throw new MarketServiceError("RECORD_NOT_FOUND", "\u767B\u8BB0\u8BB0\u5F55\u4E0D\u5B58\u5728");
      if (record.createdByUid !== uid && user.role !== "admin") throw new MarketServiceError("FORBIDDEN", "\u65E0\u6743\u91CD\u8BD5\u8BE5\u767B\u8BB0");
      const updated = record.notificationStatus === "sent" ? record : await notify(record);
      await repository2.writeAudit({
        uid,
        action: "notification_retry",
        targetType: "preadmission",
        targetId: record.recordId,
        result: "success",
        createdAt: auditNow(clock)
      });
      return updated;
    }
  };
}

// functions/marketPreadmission/src/request.ts
var actions = /* @__PURE__ */ new Set([
  "getSession",
  "searchPatients",
  "getPatientHistory",
  "createPreadmission",
  "listPreadmissions",
  "retryNotification"
]);
function parseMarketRequest(event) {
  let input = event;
  if ("body" in event) {
    try {
      input = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    } catch {
      throw new MarketServiceError("INVALID_INPUT", "\u8BF7\u6C42\u5185\u5BB9\u683C\u5F0F\u65E0\u6548");
    }
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new MarketServiceError("INVALID_INPUT", "\u8BF7\u6C42\u5185\u5BB9\u683C\u5F0F\u65E0\u6548");
  }
  const request = input;
  const action = String(request.action ?? "");
  if (!actions.has(action)) throw new MarketServiceError("INVALID_ACTION", "\u64CD\u4F5C\u7C7B\u578B\u65E0\u6548");
  return request;
}

// functions/marketPreadmission/src/wecom.ts
var WeComNotificationError = class extends Error {
  constructor(code) {
    super("\u4F01\u4E1A\u5FAE\u4FE1\u7FA4\u63A8\u9001\u5931\u8D25");
    this.code = code;
    this.name = "WeComNotificationError";
  }
  code;
};
function validateWeComWebhook(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === ["qyapi", "weixin", "qq", "com"].join(".") && url.pathname === "/cgi-bin/webhook/send" && Boolean(url.searchParams.get("key"));
  } catch {
    return false;
  }
}
function createWeComNotifier(getWebhook = () => process.env.JSMZ_PREADMISSION_WECOM_WEBHOOK_URL || "", fetcher = fetch) {
  return {
    async send(_model, markdown) {
      const webhook = getWebhook().trim();
      if (!webhook) return { status: "not_configured" };
      if (!validateWeComWebhook(webhook)) throw new WeComNotificationError("INVALID_WEBHOOK");
      let response2;
      try {
        response2 = await fetcher(webhook, {
          method: "POST",
          headers: { "content-type": "application/json; charset=utf-8" },
          body: JSON.stringify({ msgtype: "markdown", markdown: { content: markdown } }),
          signal: AbortSignal.timeout(5e3)
        });
      } catch {
        throw new WeComNotificationError("NETWORK_ERROR");
      }
      let result;
      try {
        result = await response2.json();
      } catch {
        throw new WeComNotificationError(`HTTP_${response2.status}`);
      }
      if (!response2.ok) throw new WeComNotificationError(`HTTP_${response2.status}`);
      if (Number(result.errcode) !== 0) {
        const upstream = String(result.errcode ?? "UNKNOWN").replace(/[^A-Z0-9_-]/gi, "").slice(0, 24) || "UNKNOWN";
        throw new WeComNotificationError(`WECOM_${upstream}`);
      }
      return { status: "sent", responseCode: "0" };
    }
  };
}

// functions/marketPreadmission/src/index.ts
var collectionNames = {
  users: "hospital_market_users",
  patients: "hospital_patients",
  encounters: "hospital_encounters",
  diagnoses: "hospital_diagnosis_stats",
  preadmissions: "hospital_preadmissions",
  notificationLogs: "hospital_preadmission_notification_logs",
  auditLogs: "hospital_market_audit_logs"
};
var app = (0, import_node_sdk.init)({ env: import_node_sdk.SYMBOL_CURRENT_ENV });
var db = app.database();
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function cleanRecord(value) {
  return Object.fromEntries(Object.entries(value).filter(([, field]) => field !== void 0));
}
function toPatientSummary(value) {
  return {
    patientId: String(value.patientId ?? ""),
    patientCode: String(value.patientCode ?? ""),
    name: String(value.name ?? ""),
    sex: String(value.sex ?? ""),
    age: Number.isFinite(Number(value.age)) ? Number(value.age) : null,
    phone: String(value.phone ?? ""),
    hospitalNo: String(value.hospitalNo ?? ""),
    admissionCount: Math.max(0, Math.floor(Number(value.admissionCount) || 0)),
    identityRisk: Boolean(value.identityRisk),
    identityRiskReasons: Array.isArray(value.identityRiskReasons) ? value.identityRiskReasons.map(String).slice(0, 10) : [],
    latestAdmissionDate: value.latestAdmissionDate ? String(value.latestAdmissionDate) : void 0,
    latestDischargeDate: value.latestDischargeDate ? String(value.latestDischargeDate) : void 0,
    latestDiagnosis: value.latestDiagnosis ? String(value.latestDiagnosis) : void 0
  };
}
var repository = {
  async findActiveUser(uid) {
    const result = await db.collection(collectionNames.users).where({ uid, active: true }).limit(1).get();
    const value = result.data[0];
    if (!value || !["market", "admin"].includes(String(value.role))) return null;
    return {
      uid,
      username: String(value.username ?? ""),
      displayName: String(value.displayName ?? value.username ?? "\u5E02\u573A\u4EBA\u5458"),
      role: String(value.role)
    };
  },
  async searchPatients(query, limit) {
    const field = query.kind === "hospitalNo" ? "hospitalNo" : query.kind;
    const condition = query.kind === "name" ? { [field]: new RegExp(`^${escapeRegExp(query.value)}`, "i") } : { [field]: query.value };
    const result = await db.collection(collectionNames.patients).where(condition).limit(limit).get();
    return result.data.map(toPatientSummary);
  },
  async getPatientHistory(patientId) {
    const patientResult = await db.collection(collectionNames.patients).where({ patientId }).limit(1).get();
    const rawPatient = patientResult.data[0];
    if (!rawPatient) return null;
    const [encounterResult, diagnosisResult] = await Promise.all([
      db.collection(collectionNames.encounters).where({ patientId }).limit(100).get(),
      db.collection(collectionNames.diagnoses).where({ patientId }).limit(100).get()
    ]);
    const encounters = encounterResult.data.map((value) => ({
      encounterId: String(value.encounterId ?? ""),
      patientId,
      admissionDate: String(value.admissionDate ?? ""),
      dischargeDate: String(value.dischargeDate ?? ""),
      department: String(value.department ?? ""),
      mainDiagnosis: String(value.mainDiagnosis ?? ""),
      sequence: Math.max(0, Math.floor(Number(value.sequence) || 0))
    })).sort((a, b) => b.admissionDate.localeCompare(a.admissionDate) || b.sequence - a.sequence);
    const diagnoses = diagnosisResult.data.map((value) => ({
      diagnosis: String(value.diagnosis ?? ""),
      count: Math.max(0, Math.floor(Number(value.count) || 0)),
      lastAdmissionDate: String(value.lastAdmissionDate ?? "")
    })).sort((a, b) => b.count - a.count || b.lastAdmissionDate.localeCompare(a.lastAdmissionDate));
    return { patient: toPatientSummary(rawPatient), encounters, diagnoses };
  },
  async findPreadmissionBySubmissionId(clientSubmissionId) {
    const result = await db.collection(collectionNames.preadmissions).where({ clientSubmissionId }).limit(1).get();
    return result.data[0] ?? null;
  },
  async createPreadmission(record) {
    await db.collection(collectionNames.preadmissions).add(cleanRecord(record));
    return record;
  },
  async getPreadmission(recordId) {
    const result = await db.collection(collectionNames.preadmissions).where({ recordId }).limit(1).get();
    return result.data[0] ?? null;
  },
  async updateNotification(recordId, update) {
    const result = await db.collection(collectionNames.preadmissions).where({ recordId }).limit(1).get();
    const existing = result.data[0];
    if (!existing?._id) throw new MarketServiceError("RECORD_NOT_FOUND", "\u767B\u8BB0\u8BB0\u5F55\u4E0D\u5B58\u5728");
    const cleaned = cleanRecord(update);
    await db.collection(collectionNames.preadmissions).doc(existing._id).update(cleaned);
    return { ...existing, ...cleaned };
  },
  async listPreadmissions(uid, limit) {
    const collection = db.collection(collectionNames.preadmissions);
    const query = uid ? collection.where({ createdByUid: uid }) : collection;
    const result = await query.orderBy("createdAt", "desc").limit(limit).get();
    return result.data;
  },
  async writeAudit(entry) {
    await db.collection(collectionNames.auditLogs).add(cleanRecord(entry));
  },
  async writeNotificationLog(entry) {
    await db.collection(collectionNames.notificationLogs).add(cleanRecord(entry));
  }
};
var service = createMarketPreadmissionService(repository, createWeComNotifier());
function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    },
    body: JSON.stringify(body)
  };
}
function statusForCode(code) {
  if (code === "AUTH_REQUIRED") return 401;
  if (code === "FORBIDDEN") return 403;
  if (["PATIENT_NOT_FOUND", "RECORD_NOT_FOUND"].includes(code)) return 404;
  return 400;
}
async function main(event, context) {
  try {
    const uid = (0, import_node_sdk.getCloudbaseContext)(context).TCB_UUID || "";
    const input = parseMarketRequest(event);
    if (input.action === "getSession") return response(200, { data: await service.getSession(uid) });
    if (input.action === "searchPatients") return response(200, { data: await service.searchPatients(uid, String(input.query ?? "")) });
    if (input.action === "getPatientHistory") return response(200, { data: await service.getPatientHistory(uid, String(input.patientId ?? "")) });
    if (input.action === "createPreadmission") return response(200, { data: await service.createPreadmission(uid, input.draft) });
    if (input.action === "listPreadmissions") return response(200, { data: await service.listPreadmissions(uid, Number(input.limit ?? 30)) });
    if (input.action === "retryNotification") return response(200, { data: await service.retryNotification(uid, String(input.recordId ?? "")) });
    throw new MarketServiceError("INVALID_ACTION", "\u64CD\u4F5C\u7C7B\u578B\u65E0\u6548");
  } catch (error) {
    if (error instanceof MarketServiceError) {
      return response(statusForCode(error.code), { error: { code: error.code, message: error.message } });
    }
    console.error("marketPreadmission failed", "INTERNAL_ERROR");
    return response(500, { error: { code: "INTERNAL_ERROR", message: "\u7CFB\u7EDF\u6682\u65F6\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" } });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  main
});
