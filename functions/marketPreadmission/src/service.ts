import {
  buildPreadmissionMarkdown,
  normalizePatientQuery,
  validatePreadmissionDraft,
  type MarketUser,
  type NotificationStatus,
  type PatientHistory,
  type PatientSummary,
  type PreadmissionDraft,
  type PreadmissionMessageModel,
  type PreadmissionRecord,
} from "../../../src/domain/market-preadmission";

export interface AuditEntry {
  uid: string;
  action: "session_get" | "patient_search" | "patient_history_view" | "preadmission_create" | "preadmission_list" | "notification_retry";
  targetType: "user" | "patient" | "preadmission";
  targetId: string;
  result: "success" | "denied" | "not_found" | "duplicate";
  detail?: string;
  createdAt: string;
}

export interface NotificationLog {
  recordId: string;
  attempt: number;
  status: NotificationStatus;
  responseCode?: string;
  errorCode?: string;
  createdAt: string;
}

export interface MarketRepository {
  findActiveUser(uid: string): Promise<MarketUser | null>;
  searchPatients(query: { kind: "name" | "phone" | "hospitalNo" | "patientId"; value: string }, limit: number): Promise<PatientSummary[]>;
  getPatientHistory(patientId: string): Promise<PatientHistory | null>;
  findPreadmissionBySubmissionId(clientSubmissionId: string): Promise<PreadmissionRecord | null>;
  createPreadmission(record: PreadmissionRecord): Promise<PreadmissionRecord>;
  getPreadmission(recordId: string): Promise<PreadmissionRecord | null>;
  updateNotification(
    recordId: string,
    update: Pick<PreadmissionRecord, "notificationStatus" | "notificationAttempts" | "lastNotificationAt" | "lastNotificationErrorCode" | "updatedAt">,
  ): Promise<PreadmissionRecord>;
  listPreadmissions(uid: string | null, limit: number): Promise<PreadmissionRecord[]>;
  writeAudit(entry: AuditEntry): Promise<void>;
  writeNotificationLog(entry: NotificationLog): Promise<void>;
}

export interface MarketNotifier {
  send(model: PreadmissionMessageModel, markdown: string): Promise<{ status: "sent" | "not_configured"; responseCode?: string }>;
}

export class MarketServiceError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "MarketServiceError";
  }
}

function defaultRecordId(now: Date) {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `PY-${date}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function auditNow(clock: () => Date) {
  return clock().toISOString();
}

function searchAuditDetail(kind: string, value: string) {
  if (kind === "phone") return `phone:*${value.slice(-4)}`;
  if (kind === "hospitalNo") return `hospitalNo:*${value.slice(-4)}`;
  if (kind === "name") return `name:length-${[...value].length}`;
  return `patientId:*${value.slice(-4)}`;
}

function safeDeliveryCode(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code?: unknown }).code ?? "");
    if (/^[A-Z0-9_]{2,50}$/.test(code)) return code;
  }
  return "DELIVERY_FAILED";
}

function messageModel(record: PreadmissionRecord): PreadmissionMessageModel {
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
    createdAt: record.createdAt,
  };
}

export function createMarketPreadmissionService(
  repository: MarketRepository,
  notifier: MarketNotifier,
  clock: () => Date = () => new Date(),
  createRecordId: (now: Date) => string = defaultRecordId,
) {
  const authorize = async (uid: string) => {
    if (!uid) throw new MarketServiceError("AUTH_REQUIRED", "请先登录");
    const user = await repository.findActiveUser(uid);
    if (!user) throw new MarketServiceError("FORBIDDEN", "账号未授权或已停用");
    return user;
  };

  const notify = async (record: PreadmissionRecord) => {
    if (record.notificationStatus === "sent") return record;
    const now = auditNow(clock);
    const attempt = record.notificationAttempts + 1;
    try {
      const model = messageModel(record);
      const result = await notifier.send(model, buildPreadmissionMarkdown(model));
      const updated = await repository.updateNotification(record.recordId, {
        notificationStatus: result.status,
        notificationAttempts: attempt,
        lastNotificationAt: now,
        lastNotificationErrorCode: "",
        updatedAt: now,
      });
      await repository.writeNotificationLog({
        recordId: record.recordId,
        attempt,
        status: result.status,
        responseCode: result.responseCode,
        createdAt: now,
      });
      return updated;
    } catch (error) {
      const errorCode = safeDeliveryCode(error);
      const updated = await repository.updateNotification(record.recordId, {
        notificationStatus: "failed",
        notificationAttempts: attempt,
        lastNotificationAt: now,
        lastNotificationErrorCode: errorCode,
        updatedAt: now,
      });
      await repository.writeNotificationLog({ recordId: record.recordId, attempt, status: "failed", errorCode, createdAt: now });
      return updated;
    }
  };

  return {
    async getSession(uid: string) {
      const user = await authorize(uid);
      await repository.writeAudit({
        uid,
        action: "session_get",
        targetType: "user",
        targetId: uid,
        result: "success",
        createdAt: auditNow(clock),
      });
      return user;
    },

    async searchPatients(uid: string, rawQuery: string) {
      await authorize(uid);
      const query = normalizePatientQuery(rawQuery);
      const patients = await repository.searchPatients(query, 20);
      await repository.writeAudit({
        uid,
        action: "patient_search",
        targetType: "patient",
        targetId: "search",
        result: "success",
        detail: searchAuditDetail(query.kind, query.value),
        createdAt: auditNow(clock),
      });
      return patients;
    },

    async getPatientHistory(uid: string, rawPatientId: string) {
      await authorize(uid);
      const patientId = String(rawPatientId ?? "").trim();
      if (!patientId || patientId.length > 64) throw new MarketServiceError("INVALID_INPUT", "患者标识无效");
      const history = await repository.getPatientHistory(patientId);
      await repository.writeAudit({
        uid,
        action: "patient_history_view",
        targetType: "patient",
        targetId: patientId,
        result: history ? "success" : "not_found",
        createdAt: auditNow(clock),
      });
      if (!history) throw new MarketServiceError("PATIENT_NOT_FOUND", "未找到患者记录");
      return history;
    },

    async createPreadmission(uid: string, rawDraft: PreadmissionDraft) {
      const user = await authorize(uid);
      let draft: PreadmissionDraft;
      try {
        draft = validatePreadmissionDraft(rawDraft);
      } catch (error) {
        throw new MarketServiceError("INVALID_INPUT", error instanceof Error ? error.message : "登记内容无效");
      }
      const existing = await repository.findPreadmissionBySubmissionId(draft.clientSubmissionId);
      if (existing) {
        if (existing.createdByUid !== uid && user.role !== "admin") throw new MarketServiceError("FORBIDDEN", "提交标识已被使用");
        await repository.writeAudit({
          uid,
          action: "preadmission_create",
          targetType: "preadmission",
          targetId: existing.recordId,
          result: "duplicate",
          createdAt: auditNow(clock),
        });
        return existing.notificationStatus === "sent" ? existing : notify(existing);
      }
      const history = await repository.getPatientHistory(draft.patientId);
      if (!history) throw new MarketServiceError("PATIENT_NOT_FOUND", "未找到患者记录");
      const now = clock();
      const createdAt = now.toISOString();
      const record: PreadmissionRecord = {
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
          latestDischargeDate: history.patient.latestDischargeDate,
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
        notificationAttempts: 0,
      };
      const saved = await repository.createPreadmission(record);
      await repository.writeAudit({
        uid,
        action: "preadmission_create",
        targetType: "preadmission",
        targetId: saved.recordId,
        result: "success",
        createdAt,
      });
      return notify(saved);
    },

    async listPreadmissions(uid: string, requestedLimit = 30) {
      const user = await authorize(uid);
      const limit = Math.max(1, Math.min(100, Number(requestedLimit) || 30));
      const records = await repository.listPreadmissions(user.role === "admin" ? null : uid, limit);
      await repository.writeAudit({
        uid,
        action: "preadmission_list",
        targetType: "preadmission",
        targetId: user.role === "admin" ? "all" : uid,
        result: "success",
        createdAt: auditNow(clock),
      });
      return records;
    },

    async retryNotification(uid: string, recordId: string) {
      const user = await authorize(uid);
      const record = await repository.getPreadmission(String(recordId ?? "").trim());
      if (!record) throw new MarketServiceError("RECORD_NOT_FOUND", "登记记录不存在");
      if (record.createdByUid !== uid && user.role !== "admin") throw new MarketServiceError("FORBIDDEN", "无权重试该登记");
      const updated = record.notificationStatus === "sent" ? record : await notify(record);
      await repository.writeAudit({
        uid,
        action: "notification_retry",
        targetType: "preadmission",
        targetId: record.recordId,
        result: "success",
        createdAt: auditNow(clock),
      });
      return updated;
    },
  };
}
