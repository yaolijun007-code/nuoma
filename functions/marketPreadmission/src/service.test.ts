// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type {
  MarketUser,
  NotificationStatus,
  PatientHistory,
  PreadmissionRecord,
} from "../../../src/domain/market-preadmission";
import {
  MarketServiceError,
  createMarketPreadmissionService,
  type AuditEntry,
  type MarketRepository,
  type NotificationLog,
} from "./service";

const user: MarketUser = { uid: "uid-market", username: "sc01", displayName: "市场一组", role: "market" };
const otherUser: MarketUser = { uid: "uid-other", username: "sc02", displayName: "市场二组", role: "market" };
const admin: MarketUser = { uid: "uid-admin", username: "admin01", displayName: "系统管理员", role: "admin" };
const history: PatientHistory = {
  patient: {
    patientId: "P-001",
    patientCode: "0001",
    name: "张三",
    sex: "男",
    age: 62,
    phone: "13800138000",
    hospitalNo: "202600123",
    admissionCount: 2,
    identityRisk: false,
    latestAdmissionDate: "2026-05-02",
    latestDischargeDate: "2026-05-08",
    latestDiagnosis: "腹胀",
  },
  encounters: [
    { encounterId: "E-2", patientId: "P-001", admissionDate: "2026-05-02", dischargeDate: "2026-05-08", department: "内科", mainDiagnosis: "腹胀", sequence: 2 },
  ],
  diagnoses: [{ diagnosis: "腹胀", count: 2, lastAdmissionDate: "2026-05-02" }],
};

const draft = {
  clientSubmissionId: "ad1a5d26-7f3d-4a81-8230-fc7ff5fd14c7",
  patientId: "P-001",
  contactPhone: "13800138000",
  patientType: "普通居民医保" as const,
  plannedAdmissionDate: "2026-09-20",
  intendedDepartment: "风湿免疫科" as const,
  mainProblem: "反复腹胀，希望进一步评估",
  contactResult: "patient_interested" as const,
  notes: "",
};

class MemoryRepository implements MarketRepository {
  users = new Map([[user.uid, user], [otherUser.uid, otherUser], [admin.uid, admin]]);
  records: PreadmissionRecord[] = [];
  audits: AuditEntry[] = [];
  notifications: NotificationLog[] = [];
  newPatients: PatientHistory["patient"][] = [];

  async findActiveUser(uid: string) { return this.users.get(uid) ?? null; }
  async searchPatients() { return [history.patient]; }
  async getPatientHistory(patientId: string) { return patientId === history.patient.patientId ? history : null; }
  async createNewPatientIfAbsent(patient: PatientHistory["patient"]) {
    const existing = this.newPatients.find((item) => item.patientId === patient.patientId);
    if (existing) return existing;
    this.newPatients.push(patient);
    return patient;
  }
  async findPreadmissionBySubmissionId(clientSubmissionId: string) {
    return this.records.find((record) => record.clientSubmissionId === clientSubmissionId) ?? null;
  }
  async createPreadmissionIfAbsent(record: PreadmissionRecord) {
    const existing = this.records.find((item) => item.clientSubmissionId === record.clientSubmissionId);
    if (existing) return { record: existing, created: false };
    this.records.push(record);
    return { record, created: true };
  }
  async getPreadmission(recordId: string) { return this.records.find((record) => record.recordId === recordId) ?? null; }
  async claimNotification(recordId: string, expectedAttempts: number, update: Parameters<MarketRepository["claimNotification"]>[2]) {
    const index = this.records.findIndex((record) => record.recordId === recordId);
    const current = this.records[index];
    if (!current || current.notificationAttempts !== expectedAttempts || !["pending", "failed", "not_configured"].includes(current.notificationStatus)) return null;
    this.records[index] = { ...current, ...update };
    return this.records[index];
  }
  async updateNotification(recordId: string, update: Pick<PreadmissionRecord, "notificationStatus" | "notificationAttempts" | "lastNotificationAt" | "lastNotificationErrorCode" | "updatedAt">) {
    const index = this.records.findIndex((record) => record.recordId === recordId);
    this.records[index] = { ...this.records[index], ...update };
    return this.records[index];
  }
  async listPreadmissions(uid: string | null, limit: number) {
    return this.records.filter((record) => !uid || record.createdByUid === uid).slice(0, limit);
  }
  async writeAudit(entry: AuditEntry) { this.audits.push(entry); }
  async writeNotificationLog(entry: NotificationLog) { this.notifications.push(entry); }
}

function makeService(repository = new MemoryRepository(), notificationStatus: NotificationStatus | Error = "sent") {
  const send = vi.fn(async () => {
    if (notificationStatus instanceof Error) throw notificationStatus;
    return { status: notificationStatus, responseCode: notificationStatus === "sent" ? "0" : undefined };
  });
  return {
    repository,
    send,
    service: createMarketPreadmissionService(repository, { send }, () => new Date("2026-09-07T08:30:00.000Z"), () => "PY-20260907-0001"),
  };
}

describe("market preadmission service", () => {
  it("rejects anonymous and disabled users", async () => {
    const { service, repository } = makeService();
    await expect(service.searchPatients("", "张三", "req-anonymous")).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
    await expect(service.searchPatients("uid-disabled", "张三", "req-disabled")).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(repository.audits).toEqual(expect.arrayContaining([
      expect.objectContaining({ uid: "anonymous", action: "patient_search", result: "denied", requestId: "req-anonymous" }),
      expect.objectContaining({ uid: "uid-disabled", action: "patient_search", result: "denied", requestId: "req-disabled" }),
    ]));
    expect(JSON.stringify(repository.audits)).not.toContain("张三");
  });

  it("maps an invalid patient query to INVALID_INPUT and audits it without raw input", async () => {
    const { service, repository } = makeService();
    await expect(service.searchPatients(user.uid, "<invalid patient query>", "req-invalid"))
      .rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(repository.audits.at(-1)).toMatchObject({
      uid: user.uid,
      action: "patient_search",
      result: "invalid",
      requestId: "req-invalid",
      detail: "query:invalid",
    });
    expect(JSON.stringify(repository.audits)).not.toContain("invalid patient query");
  });

  it("normalizes patient searches and records a non-sensitive audit descriptor", async () => {
    const { service, repository } = makeService();
    await service.searchPatients(user.uid, " 138 0013 8000 ");
    expect(repository.audits.at(-1)).toMatchObject({ uid: user.uid, action: "patient_search", result: "success" });
    expect(repository.audits.at(-1)?.detail).toBe("phone:*8000");
  });

  it("requires the selected patient to exist", async () => {
    const { service } = makeService();
    await expect(service.getPatientHistory(user.uid, "P-404")).rejects.toMatchObject({ code: "PATIENT_NOT_FOUND" });
    await expect(service.createPreadmission(user.uid, { ...draft, patientId: "P-404" })).rejects.toMatchObject({ code: "PATIENT_NOT_FOUND" });
  });

  it("persists before sending and includes full patient identity in the notification model", async () => {
    const { service, repository, send } = makeService();
    const result = await service.createPreadmission(user.uid, { ...draft, notes: "上午联系方便" });
    expect(repository.records).toHaveLength(1);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toMatchObject({
      patientName: "张三",
      contactPhone: "13800138000",
      patientType: "普通居民医保",
      intendedDepartment: "风湿免疫科",
      notes: "上午联系方便",
    });
    expect(send.mock.calls[0][1]).toContain("**备注**：上午联系方便");
    expect(result).toMatchObject({
      recordId: "PY-20260907-0001",
      patientType: "普通居民医保",
      intendedDepartment: "风湿免疫科",
      notificationStatus: "sent",
      notificationAttempts: 1,
    });
    expect(repository.notifications[0]).toMatchObject({ recordId: "PY-20260907-0001", status: "sent", attempt: 1 });
  });

  it("creates a searchable zero-history profile for a new patient and registers the preadmission", async () => {
    const { service, repository, send } = makeService();
    const result = await service.createPreadmission(user.uid, {
      ...draft,
      patientId: "",
      contactPhone: "13900139000",
      newPatient: { name: "李四", sex: "女", age: 47 },
    });
    expect(repository.newPatients).toHaveLength(1);
    expect(repository.newPatients[0]).toMatchObject({
      name: "李四",
      phone: "13900139000",
      admissionCount: 0,
      hospitalNo: "",
    });
    expect(result).toMatchObject({ patientName: "李四", notificationStatus: "sent" });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ patientName: "李四", contactPhone: "13900139000", admissionCount: 0 }), expect.any(String));
  });

  it("returns the existing sent record for a duplicate submission without resending", async () => {
    const { service, repository, send } = makeService();
    const first = await service.createPreadmission(user.uid, draft);
    const duplicate = await service.createPreadmission(user.uid, draft);
    expect(duplicate.recordId).toBe(first.recordId);
    expect(repository.records).toHaveLength(1);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("creates only one record and one notification for concurrent duplicate submissions", async () => {
    const { service, repository, send } = makeService();
    const [first, second] = await Promise.all([
      service.createPreadmission(user.uid, draft),
      service.createPreadmission(user.uid, draft),
    ]);
    expect(repository.records).toHaveLength(1);
    expect(first.recordId).toBe(second.recordId);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("keeps a saved record when notification delivery fails", async () => {
    const { service, repository } = makeService(new MemoryRepository(), new Error("timeout and private details"));
    const result = await service.createPreadmission(user.uid, draft);
    expect(repository.records).toHaveLength(1);
    expect(result).toMatchObject({ notificationStatus: "failed", notificationAttempts: 1, lastNotificationErrorCode: "DELIVERY_FAILED" });
    expect(repository.notifications[0]).toMatchObject({ status: "failed", errorCode: "DELIVERY_FAILED" });
    expect(JSON.stringify(repository.notifications)).not.toContain("private details");
  });

  it("allows the owner and admin to retry failed notifications but never retries sent records", async () => {
    const repository = new MemoryRepository();
    const failed = makeService(repository, new Error("timeout"));
    const saved = await failed.service.createPreadmission(user.uid, { ...draft, notes: "下午回电" });
    const success = makeService(repository, "sent");
    const retried = await success.service.retryNotification(user.uid, saved.recordId);
    expect(retried.notificationStatus).toBe("sent");
    expect(success.send).toHaveBeenCalledWith(
      expect.objectContaining({ notes: "下午回电" }),
      expect.stringContaining("**备注**：下午回电"),
    );
    await success.service.retryNotification(admin.uid, saved.recordId);
    expect(success.send).toHaveBeenCalledTimes(1);
    await expect(success.service.retryNotification(otherUser.uid, saved.recordId, "req-denied-retry")).rejects.toBeInstanceOf(MarketServiceError);
    expect(repository.audits.at(-1)).toMatchObject({
      uid: otherUser.uid,
      action: "notification_retry",
      result: "denied",
      requestId: "req-denied-retry",
    });
  });

  it("does not mark a delivered message as failed when the sent-state write fails", async () => {
    class SentStateFailureRepository extends MemoryRepository {
      override async updateNotification(recordId: string, update: Parameters<MarketRepository["updateNotification"]>[1]) {
        if (update.notificationStatus === "sent") throw new Error("database unavailable after delivery");
        return super.updateNotification(recordId, update);
      }
    }
    const repository = new SentStateFailureRepository();
    const attempt = makeService(repository, "sent");
    const result = await attempt.service.createPreadmission(user.uid, draft);
    expect(result.notificationStatus).toBe("delivery_unknown");
    expect(repository.records[0].notificationStatus).toBe("sending");
    await attempt.service.retryNotification(user.uid, result.recordId);
    expect(attempt.send).toHaveBeenCalledTimes(1);
  });

  it("allows only one sender to claim two concurrent retries", async () => {
    const repository = new MemoryRepository();
    const failed = makeService(repository, new Error("timeout"));
    const saved = await failed.service.createPreadmission(user.uid, draft);
    const success = makeService(repository, "sent");
    await Promise.all([
      success.service.retryNotification(user.uid, saved.recordId),
      success.service.retryNotification(user.uid, saved.recordId),
    ]);
    expect(success.send).toHaveBeenCalledTimes(1);
  });

  it("keeps a sent state when notification logging fails", async () => {
    class LogFailureRepository extends MemoryRepository {
      override async writeNotificationLog() { throw new Error("log unavailable"); }
    }
    const repository = new LogFailureRepository();
    const attempt = makeService(repository, "sent");
    const result = await attempt.service.createPreadmission(user.uid, draft);
    expect(result.notificationStatus).toBe("sent");
    expect(repository.records[0].notificationStatus).toBe("sent");
  });

  it("limits market lists to the current creator while admins can list all", async () => {
    const { service, repository } = makeService();
    await service.createPreadmission(user.uid, draft);
    const listed = await service.listPreadmissions(user.uid, 200);
    expect(listed).toHaveLength(1);
    expect(Object.keys(listed[0]).sort()).toEqual([
      "contactResult",
      "createdAt",
      "notificationStatus",
      "patientName",
      "plannedAdmissionDate",
      "recordId",
    ]);
    expect(await service.listPreadmissions(admin.uid, 200)).toHaveLength(1);
    expect(repository.audits.at(-1)?.action).toBe("preadmission_list");
  });
});
