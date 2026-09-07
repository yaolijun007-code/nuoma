import { getCloudbaseContext, init, SYMBOL_CURRENT_ENV } from "@cloudbase/node-sdk";
import type {
  MarketUser,
  PatientHistory,
  PatientSummary,
  PreadmissionDraft,
  PreadmissionRecord,
} from "../../../src/domain/market-preadmission";
import {
  MarketServiceError,
  createMarketPreadmissionService,
  type AuditEntry,
  type MarketRepository,
  type NotificationLog,
} from "./service";
import { parseMarketRequest } from "./request";
import { createWeComNotifier } from "./wecom";

const collectionNames = {
  users: "hospital_market_users",
  patients: "hospital_patients",
  encounters: "hospital_encounters",
  diagnoses: "hospital_diagnosis_stats",
  preadmissions: "hospital_preadmissions",
  notificationLogs: "hospital_preadmission_notification_logs",
  auditLogs: "hospital_market_audit_logs",
} as const;

const app = init({ env: SYMBOL_CURRENT_ENV });
const db = app.database();

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanRecord<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined));
}

function withoutInternalId<T>(value: Record<string, unknown> | undefined): T | null {
  if (!value) return null;
  const { _id: _internalId, ...record } = value;
  return record as T;
}

function toPatientSummary(value: Record<string, unknown>): PatientSummary {
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
    latestAdmissionDate: value.latestAdmissionDate ? String(value.latestAdmissionDate) : undefined,
    latestDischargeDate: value.latestDischargeDate ? String(value.latestDischargeDate) : undefined,
    latestDiagnosis: value.latestDiagnosis ? String(value.latestDiagnosis) : undefined,
  };
}

const repository: MarketRepository = {
  async findActiveUser(uid) {
    const result = await db.collection(collectionNames.users).where({ uid, active: true }).limit(1).get();
    const value = result.data[0] as Record<string, unknown> | undefined;
    if (!value || !["market", "admin"].includes(String(value.role))) return null;
    return {
      uid,
      username: String(value.username ?? ""),
      displayName: String(value.displayName ?? value.username ?? "市场人员"),
      role: String(value.role) as MarketUser["role"],
    };
  },

  async searchPatients(query, limit) {
    const field = query.kind === "hospitalNo" ? "hospitalNo" : query.kind;
    const condition = query.kind === "name"
      ? { [field]: new RegExp(`^${escapeRegExp(query.value)}`, "i") }
      : { [field]: query.value };
    const result = await db.collection(collectionNames.patients).where(condition).limit(limit).get();
    return (result.data as Record<string, unknown>[]).map(toPatientSummary);
  },

  async getPatientHistory(patientId) {
    const patientResult = await db.collection(collectionNames.patients).where({ patientId }).limit(1).get();
    const rawPatient = patientResult.data[0] as Record<string, unknown> | undefined;
    if (!rawPatient) return null;
    const [encounterResult, diagnosisResult] = await Promise.all([
      db.collection(collectionNames.encounters).where({ patientId }).limit(100).get(),
      db.collection(collectionNames.diagnoses).where({ patientId }).limit(100).get(),
    ]);
    const encounters = (encounterResult.data as Record<string, unknown>[]).map((value) => ({
      encounterId: String(value.encounterId ?? ""),
      patientId,
      admissionDate: String(value.admissionDate ?? ""),
      dischargeDate: String(value.dischargeDate ?? ""),
      department: String(value.department ?? ""),
      mainDiagnosis: String(value.mainDiagnosis ?? ""),
      sequence: Math.max(0, Math.floor(Number(value.sequence) || 0)),
    })).sort((a, b) => b.admissionDate.localeCompare(a.admissionDate) || b.sequence - a.sequence);
    const diagnoses = (diagnosisResult.data as Record<string, unknown>[]).map((value) => ({
      diagnosis: String(value.diagnosis ?? ""),
      count: Math.max(0, Math.floor(Number(value.count) || 0)),
      lastAdmissionDate: String(value.lastAdmissionDate ?? ""),
    })).sort((a, b) => b.count - a.count || b.lastAdmissionDate.localeCompare(a.lastAdmissionDate));
    return { patient: toPatientSummary(rawPatient), encounters, diagnoses } satisfies PatientHistory;
  },

  async createNewPatientIfAbsent(patient, createdByUid, createdAt) {
    try {
      await db.collection(collectionNames.patients).add(cleanRecord({
        ...(patient as unknown as Record<string, unknown>),
        _id: `patient_${patient.patientId}`,
        source: "market_new",
        createdByUid,
        createdAt,
        updatedAt: createdAt,
      }));
      return patient;
    } catch (error) {
      const result = await db.collection(collectionNames.patients).where({ patientId: patient.patientId }).limit(1).get();
      const existing = result.data[0] as Record<string, unknown> | undefined;
      if (existing) return toPatientSummary(existing);
      throw error;
    }
  },

  async findPreadmissionBySubmissionId(clientSubmissionId) {
    const result = await db.collection(collectionNames.preadmissions).where({ clientSubmissionId }).limit(1).get();
    return withoutInternalId<PreadmissionRecord>(result.data[0] as Record<string, unknown> | undefined);
  },

  async createPreadmissionIfAbsent(record) {
    try {
      await db.collection(collectionNames.preadmissions).add(cleanRecord({
        ...(record as unknown as Record<string, unknown>),
        _id: `preadmission_${record.clientSubmissionId}`,
      }));
      return { record, created: true };
    } catch (error) {
      const existing = await this.findPreadmissionBySubmissionId(record.clientSubmissionId);
      if (existing) return { record: existing, created: false };
      throw error;
    }
  },

  async getPreadmission(recordId) {
    const result = await db.collection(collectionNames.preadmissions).where({ recordId }).limit(1).get();
    return withoutInternalId<PreadmissionRecord>(result.data[0] as Record<string, unknown> | undefined);
  },

  async claimNotification(recordId, expectedAttempts, update) {
    const result = await db.collection(collectionNames.preadmissions).where({
      recordId,
      notificationAttempts: expectedAttempts,
      notificationStatus: db.command.in(["pending", "failed", "not_configured"]),
    }).update(cleanRecord(update as unknown as Record<string, unknown>));
    const updatedCount = Number((result as unknown as { updated?: number; stats?: { updated?: number } }).updated
      ?? (result as unknown as { stats?: { updated?: number } }).stats?.updated
      ?? 0);
    if (updatedCount !== 1) return null;
    return this.getPreadmission(recordId);
  },

  async updateNotification(recordId, update) {
    const result = await db.collection(collectionNames.preadmissions).where({ recordId }).limit(1).get();
    const existing = result.data[0] as (PreadmissionRecord & { _id?: string }) | undefined;
    if (!existing?._id) throw new MarketServiceError("RECORD_NOT_FOUND", "登记记录不存在");
    const cleaned = cleanRecord(update as unknown as Record<string, unknown>);
    await db.collection(collectionNames.preadmissions).doc(existing._id).update(cleaned);
    return withoutInternalId<PreadmissionRecord>({ ...existing, ...cleaned }) as PreadmissionRecord;
  },

  async listPreadmissions(uid, limit) {
    const collection = db.collection(collectionNames.preadmissions);
    const query = uid ? collection.where({ createdByUid: uid }) : collection;
    const result = await query.orderBy("createdAt", "desc").limit(limit).get();
    return result.data as PreadmissionRecord[];
  },

  async writeAudit(entry: AuditEntry) {
    await db.collection(collectionNames.auditLogs).add(cleanRecord(entry as unknown as Record<string, unknown>));
  },

  async writeNotificationLog(entry: NotificationLog) {
    await db.collection(collectionNames.notificationLogs).add(cleanRecord(entry as unknown as Record<string, unknown>));
  },
};

const service = createMarketPreadmissionService(repository, createWeComNotifier());

function response(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function statusForCode(code: string) {
  if (code === "AUTH_REQUIRED") return 401;
  if (code === "FORBIDDEN") return 403;
  if (["PATIENT_NOT_FOUND", "RECORD_NOT_FOUND"].includes(code)) return 404;
  return 400;
}

function requestIdFromContext(context: unknown) {
  if (!context || typeof context !== "object") return "unavailable";
  const value = context as Record<string, unknown>;
  return String(value.request_id ?? value.requestId ?? value.SCF_REQUEST_ID ?? "unavailable");
}

export async function main(event: Record<string, unknown>, context: unknown) {
  try {
    const uid = getCloudbaseContext(context as never).TCB_UUID || "";
    const requestId = requestIdFromContext(context);
    const input = parseMarketRequest(event);
    if (input.action === "getSession") return response(200, { data: await service.getSession(uid, requestId) });
    if (input.action === "searchPatients") return response(200, { data: await service.searchPatients(uid, String(input.query ?? ""), requestId) });
    if (input.action === "getPatientHistory") return response(200, { data: await service.getPatientHistory(uid, String(input.patientId ?? ""), requestId) });
    if (input.action === "createPreadmission") return response(200, { data: await service.createPreadmission(uid, input.draft as PreadmissionDraft, requestId) });
    if (input.action === "listPreadmissions") return response(200, { data: await service.listPreadmissions(uid, Number(input.limit ?? 30), requestId) });
    if (input.action === "retryNotification") return response(200, { data: await service.retryNotification(uid, String(input.recordId ?? ""), requestId) });
    throw new MarketServiceError("INVALID_ACTION", "操作类型无效");
  } catch (error) {
    if (error instanceof MarketServiceError) {
      return response(statusForCode(error.code), { error: { code: error.code, message: error.message } });
    }
    console.error("marketPreadmission failed", "INTERNAL_ERROR");
    return response(500, { error: { code: "INTERNAL_ERROR", message: "系统暂时不可用，请稍后重试" } });
  }
}
