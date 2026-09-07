import {
  buildPreadmissionMarkdown,
  normalizePatientQuery,
  validatePreadmissionDraft,
  type MarketUser,
  type NotificationStatus,
  type PatientHistory,
  type PatientSummary,
  type PreadmissionDraft,
  type PreadmissionListItem,
  type PreadmissionMessageModel,
  type PreadmissionRecord,
} from "../../../src/domain/market-preadmission";

export interface AuditEntry {
  uid: string;
  action: "session_get" | "patient_search" | "patient_history_view" | "preadmission_create" | "preadmission_list" | "notification_retry";
  targetType: "user" | "patient" | "preadmission";
  targetId: string;
  result: "success" | "denied" | "invalid" | "not_found" | "duplicate";
  detail?: string;
  requestId: string;
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

type NotificationUpdate = Pick<PreadmissionRecord, "notificationStatus" | "notificationAttempts" | "lastNotificationAt" | "lastNotificationErrorCode" | "updatedAt">;

export interface MarketRepository {
  findActiveUser(uid: string): Promise<MarketUser | null>;
  searchPatients(query: { kind: "name" | "phone" | "hospitalNo" | "patientId"; value: string }, limit: number): Promise<PatientSummary[]>;
  getPatientHistory(patientId: string): Promise<PatientHistory | null>;
  createNewPatientIfAbsent(patient: PatientSummary, createdByUid: string, createdAt: string): Promise<PatientSummary>;
  findPreadmissionBySubmissionId(clientSubmissionId: string): Promise<PreadmissionRecord | null>;
  createPreadmissionIfAbsent(record: PreadmissionRecord): Promise<{ record: PreadmissionRecord; created: boolean }>;
  getPreadmission(recordId: string): Promise<PreadmissionRecord | null>;
  claimNotification(recordId: string, expectedAttempts: number, update: NotificationUpdate): Promise<PreadmissionRecord | null>;
  updateNotification(
    recordId: string,
    update: NotificationUpdate,
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

function newPatientId(clientSubmissionId: string) {
  return `N-${clientSubmissionId.replaceAll("-", "").slice(0, 24).toUpperCase()}`;
}

function auditNow(clock: () => Date) {
  return clock().toISOString();
}

function normalizedRequestId(value: unknown) {
  const requestId = String(value ?? "").replace(/[^A-Za-z0-9_.:-]/g, "").slice(0, 128);
  return requestId || "unavailable";
}

function safeTargetId(value: unknown, fallback: string) {
  const targetId = String(value ?? "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
  return targetId || fallback;
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

function toPreadmissionListItem(record: PreadmissionRecord): PreadmissionListItem {
  return {
    recordId: record.recordId,
    patientName: record.patientName,
    plannedAdmissionDate: record.plannedAdmissionDate,
    contactResult: record.contactResult,
    createdAt: record.createdAt,
    notificationStatus: record.notificationStatus,
  };
}

export function createMarketPreadmissionService(
  repository: MarketRepository,
  notifier: MarketNotifier,
  clock: () => Date = () => new Date(),
  createRecordId: (now: Date) => string = defaultRecordId,
) {
  const safeWriteAudit = async (entry: AuditEntry) => {
    try {
      await repository.writeAudit(entry);
    } catch {
      // An audit-store outage must not replace the original denial or invalid-input error.
    }
  };

  const authorize = async (
    uid: string,
    action: AuditEntry["action"],
    targetType: AuditEntry["targetType"],
    targetId: string,
    requestId: string,
  ) => {
    if (!uid) {
      await safeWriteAudit({
        uid: "anonymous",
        action,
        targetType,
        targetId,
        result: "denied",
        requestId,
        createdAt: auditNow(clock),
      });
      throw new MarketServiceError("AUTH_REQUIRED", "请先登录");
    }
    const user = await repository.findActiveUser(uid);
    if (!user) {
      await safeWriteAudit({
        uid,
        action,
        targetType,
        targetId,
        result: "denied",
        requestId,
        createdAt: auditNow(clock),
      });
      throw new MarketServiceError("FORBIDDEN", "账号未授权或已停用");
    }
    return user;
  };

  const writeNotificationLog = async (entry: NotificationLog) => {
    try {
      await repository.writeNotificationLog(entry);
    } catch {
      // Delivery state is authoritative. A secondary audit-log outage must not
      // downgrade a confirmed send or make the notification retryable.
    }
  };

  const notify = async (record: PreadmissionRecord) => {
    if (["sent", "sending", "delivery_unknown"].includes(record.notificationStatus)) return record;
    const now = auditNow(clock);
    const attempt = record.notificationAttempts + 1;
    const claimed = await repository.claimNotification(record.recordId, record.notificationAttempts, {
      notificationStatus: "sending",
      notificationAttempts: attempt,
      lastNotificationAt: now,
      lastNotificationErrorCode: "",
      updatedAt: now,
    });
    if (!claimed) return await repository.getPreadmission(record.recordId) ?? record;
    let delivery: Awaited<ReturnType<MarketNotifier["send"]>>;
    try {
      const model = messageModel(claimed);
      delivery = await notifier.send(model, buildPreadmissionMarkdown(model));
    } catch (error) {
      const errorCode = safeDeliveryCode(error);
      try {
        const failed = await repository.updateNotification(record.recordId, {
          notificationStatus: "failed",
          notificationAttempts: attempt,
          lastNotificationAt: now,
          lastNotificationErrorCode: errorCode,
          updatedAt: now,
        });
        await writeNotificationLog({ recordId: record.recordId, attempt, status: "failed", errorCode, createdAt: now });
        return failed;
      } catch {
        return { ...claimed, notificationStatus: "delivery_unknown", lastNotificationErrorCode: "STATE_WRITE_FAILED" };
      }
    }
    try {
      const updated = await repository.updateNotification(record.recordId, {
        notificationStatus: delivery.status,
        notificationAttempts: attempt,
        lastNotificationAt: now,
        lastNotificationErrorCode: "",
        updatedAt: now,
      });
      await writeNotificationLog({
        recordId: record.recordId,
        attempt,
        status: delivery.status,
        responseCode: delivery.responseCode,
        createdAt: now,
      });
      return updated;
    } catch {
      return { ...claimed, notificationStatus: "delivery_unknown", lastNotificationErrorCode: "STATE_WRITE_FAILED" };
    }
  };

  return {
    async getSession(uid: string, rawRequestId = "") {
      const requestId = normalizedRequestId(rawRequestId);
      const user = await authorize(uid, "session_get", "user", safeTargetId(uid, "anonymous"), requestId);
      await repository.writeAudit({
        uid,
        action: "session_get",
        targetType: "user",
        targetId: uid,
        result: "success",
        requestId,
        createdAt: auditNow(clock),
      });
      return user;
    },

    async searchPatients(uid: string, rawQuery: string, rawRequestId = "") {
      const requestId = normalizedRequestId(rawRequestId);
      await authorize(uid, "patient_search", "patient", "search", requestId);
      let query: ReturnType<typeof normalizePatientQuery>;
      try {
        query = normalizePatientQuery(rawQuery);
      } catch (error) {
        await safeWriteAudit({
          uid,
          action: "patient_search",
          targetType: "patient",
          targetId: "search",
          result: "invalid",
          detail: "query:invalid",
          requestId,
          createdAt: auditNow(clock),
        });
        throw new MarketServiceError("INVALID_INPUT", error instanceof Error ? error.message : "查询内容无效");
      }
      const patients = await repository.searchPatients(query, 20);
      await repository.writeAudit({
        uid,
        action: "patient_search",
        targetType: "patient",
        targetId: "search",
        result: "success",
        detail: searchAuditDetail(query.kind, query.value),
        requestId,
        createdAt: auditNow(clock),
      });
      return patients;
    },

    async getPatientHistory(uid: string, rawPatientId: string, rawRequestId = "") {
      const requestId = normalizedRequestId(rawRequestId);
      await authorize(uid, "patient_history_view", "patient", safeTargetId(rawPatientId, "invalid"), requestId);
      const patientId = String(rawPatientId ?? "").trim();
      if (!patientId || patientId.length > 64) {
        await safeWriteAudit({
          uid,
          action: "patient_history_view",
          targetType: "patient",
          targetId: "invalid",
          result: "invalid",
          requestId,
          createdAt: auditNow(clock),
        });
        throw new MarketServiceError("INVALID_INPUT", "患者标识无效");
      }
      const history = await repository.getPatientHistory(patientId);
      await repository.writeAudit({
        uid,
        action: "patient_history_view",
        targetType: "patient",
        targetId: patientId,
        result: history ? "success" : "not_found",
        requestId,
        createdAt: auditNow(clock),
      });
      if (!history) throw new MarketServiceError("PATIENT_NOT_FOUND", "未找到患者记录");
      return history;
    },

    async createPreadmission(uid: string, rawDraft: PreadmissionDraft, rawRequestId = "") {
      const requestId = normalizedRequestId(rawRequestId);
      const user = await authorize(uid, "preadmission_create", "preadmission", "new", requestId);
      let draft: PreadmissionDraft;
      try {
        draft = validatePreadmissionDraft(rawDraft);
      } catch (error) {
        await safeWriteAudit({
          uid,
          action: "preadmission_create",
          targetType: "preadmission",
          targetId: "new",
          result: "invalid",
          requestId,
          createdAt: auditNow(clock),
        });
        throw new MarketServiceError("INVALID_INPUT", error instanceof Error ? error.message : "登记内容无效");
      }
      const existing = await repository.findPreadmissionBySubmissionId(draft.clientSubmissionId);
      if (existing) {
        if (existing.createdByUid !== uid && user.role !== "admin") {
          await safeWriteAudit({
            uid,
            action: "preadmission_create",
            targetType: "preadmission",
            targetId: existing.recordId,
            result: "denied",
            requestId,
            createdAt: auditNow(clock),
          });
          throw new MarketServiceError("FORBIDDEN", "提交标识已被使用");
        }
        await repository.writeAudit({
          uid,
          action: "preadmission_create",
          targetType: "preadmission",
          targetId: existing.recordId,
          result: "duplicate",
          requestId,
          createdAt: auditNow(clock),
        });
        return existing.notificationStatus === "sent" ? existing : notify(existing);
      }
      const now = clock();
      const createdAt = now.toISOString();
      let history: PatientHistory | null;
      if (draft.newPatient) {
        const patientId = newPatientId(draft.clientSubmissionId);
        const patient = await repository.createNewPatientIfAbsent({
          patientId,
          patientCode: patientId,
          name: draft.newPatient.name,
          sex: draft.newPatient.sex,
          age: draft.newPatient.age,
          phone: draft.contactPhone,
          hospitalNo: "",
          admissionCount: 0,
          identityRisk: false,
        }, uid, createdAt);
        history = { patient, encounters: [], diagnoses: [] };
      } else {
        history = await repository.getPatientHistory(draft.patientId);
      }
      if (!history) throw new MarketServiceError("PATIENT_NOT_FOUND", "未找到患者记录");
      const record: PreadmissionRecord = {
        recordId: createRecordId(now),
        clientSubmissionId: draft.clientSubmissionId,
        patientId: history.patient.patientId,
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
      const creation = await repository.createPreadmissionIfAbsent(record);
      const saved = creation.record;
      if (!creation.created) {
        if (saved.createdByUid !== uid && user.role !== "admin") {
          await safeWriteAudit({
            uid,
            action: "preadmission_create",
            targetType: "preadmission",
            targetId: saved.recordId,
            result: "denied",
            requestId,
            createdAt: auditNow(clock),
          });
          throw new MarketServiceError("FORBIDDEN", "提交标识已被使用");
        }
        await repository.writeAudit({
          uid,
          action: "preadmission_create",
          targetType: "preadmission",
          targetId: saved.recordId,
          result: "duplicate",
          requestId,
          createdAt: auditNow(clock),
        });
        return notify(saved);
      }
      await repository.writeAudit({
        uid,
        action: "preadmission_create",
        targetType: "preadmission",
        targetId: saved.recordId,
        result: "success",
        requestId,
        createdAt,
      });
      return notify(saved);
    },

    async listPreadmissions(uid: string, requestedLimit = 30, rawRequestId = "") {
      const requestId = normalizedRequestId(rawRequestId);
      const user = await authorize(uid, "preadmission_list", "preadmission", "list", requestId);
      const limit = Math.max(1, Math.min(100, Number(requestedLimit) || 30));
      const records = await repository.listPreadmissions(user.role === "admin" ? null : uid, limit);
      await repository.writeAudit({
        uid,
        action: "preadmission_list",
        targetType: "preadmission",
        targetId: user.role === "admin" ? "all" : uid,
        result: "success",
        requestId,
        createdAt: auditNow(clock),
      });
      return records.map(toPreadmissionListItem);
    },

    async retryNotification(uid: string, recordId: string, rawRequestId = "") {
      const requestId = normalizedRequestId(rawRequestId);
      const targetId = safeTargetId(recordId, "invalid");
      const user = await authorize(uid, "notification_retry", "preadmission", targetId, requestId);
      const record = await repository.getPreadmission(String(recordId ?? "").trim());
      if (!record) throw new MarketServiceError("RECORD_NOT_FOUND", "登记记录不存在");
      if (record.createdByUid !== uid && user.role !== "admin") {
        await safeWriteAudit({
          uid,
          action: "notification_retry",
          targetType: "preadmission",
          targetId: record.recordId,
          result: "denied",
          requestId,
          createdAt: auditNow(clock),
        });
        throw new MarketServiceError("FORBIDDEN", "无权重试该登记");
      }
      const updated = record.notificationStatus === "sent" ? record : await notify(record);
      await repository.writeAudit({
        uid,
        action: "notification_retry",
        targetType: "preadmission",
        targetId: record.recordId,
        result: "success",
        requestId,
        createdAt: auditNow(clock),
      });
      return updated;
    },
  };
}
