export type MarketRole = "market" | "admin";
export type PatientQueryKind = "name" | "phone" | "hospitalNo" | "patientId";
export type NotificationStatus = "pending" | "sent" | "failed" | "not_configured";
export type ContactResult = "patient_interested" | "family_interested" | "considering" | "no_answer" | "declined" | "other";

export interface MarketUser {
  uid: string;
  username: string;
  displayName: string;
  role: MarketRole;
}

export interface PatientSummary {
  patientId: string;
  patientCode: string;
  name: string;
  sex: string;
  age: number | null;
  phone: string;
  hospitalNo: string;
  admissionCount: number;
  identityRisk: boolean;
  identityRiskReasons?: string[];
  latestAdmissionDate?: string;
  latestDischargeDate?: string;
  latestDiagnosis?: string;
}

export interface PatientEncounter {
  encounterId: string;
  admissionDate: string;
  dischargeDate: string;
  department: string;
  mainDiagnosis: string;
  sequence: number;
}

export interface DiagnosisStat {
  diagnosis: string;
  count: number;
  lastAdmissionDate: string;
}

export interface PatientHistory {
  patient: PatientSummary;
  encounters: PatientEncounter[];
  diagnoses: DiagnosisStat[];
}

export interface PreadmissionDraft {
  clientSubmissionId: string;
  patientId: string;
  contactPhone: string;
  plannedAdmissionDate: string;
  intendedDepartment: string;
  mainProblem: string;
  contactResult: ContactResult;
  notes: string;
}

export interface PreadmissionRecord {
  recordId: string;
  clientSubmissionId: string;
  patientId: string;
  patientName: string;
  contactPhone: string;
  plannedAdmissionDate: string;
  intendedDepartment: string;
  mainProblem: string;
  contactResult: ContactResult;
  notes: string;
  createdByUid: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  notificationStatus: NotificationStatus;
  notificationAttempts: number;
  lastNotificationAt?: string;
  lastNotificationErrorCode?: string;
}

export interface PreadmissionMessageModel {
  recordId: string;
  patientName: string;
  contactPhone: string;
  sex: string;
  age: number | null;
  admissionCount: number;
  latestAdmissionDate?: string;
  latestDischargeDate?: string;
  plannedAdmissionDate: string;
  intendedDepartment: string;
  mainProblem: string;
  contactResult: ContactResult;
  createdByName: string;
  createdAt: string;
}

const contactResults: Record<ContactResult, string> = {
  patient_interested: "患者本人有意愿",
  family_interested: "家属有意愿",
  considering: "正在考虑",
  no_answer: "暂未接通",
  declined: "暂不考虑",
  other: "其他",
};

const allowedContactResults = new Set(Object.keys(contactResults));

export function safeInline(value: unknown, limit = 120) {
  return String(value ?? "")
    .replace(/[\r\n<>`\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

export function normalizePatientQuery(raw: string): { kind: PatientQueryKind; value: string } {
  const value = String(raw ?? "").trim();
  const digits = value.replace(/\s+/g, "");
  if (/^1\d{10}$/.test(digits)) return { kind: "phone", value: digits };
  if (/^\d{5,20}$/.test(digits)) return { kind: "hospitalNo", value: digits };
  if (/^[\p{Script=Han}·]{2,30}$/u.test(value)) return { kind: "name", value };
  if (/^[A-Za-z][A-Za-z0-9_-]{0,31}$/.test(value)) return { kind: "patientId", value: value.toUpperCase() };
  if (value.length < 2) throw new Error("至少输入 2 个字");
  throw new Error("请输入正确的患者姓名、手机号或住院号");
}

function requiredText(value: unknown, label: string, max: number) {
  const normalized = safeInline(value, max + 1);
  if (!normalized) throw new Error(`请填写${label}`);
  if (normalized.length > max) throw new Error(`${label}不能超过 ${max} 个字`);
  return normalized;
}

function optionalText(value: unknown, label: string, max: number) {
  const normalized = safeInline(value, max + 1);
  if (normalized.length > max) throw new Error(`${label}不能超过 ${max} 个字`);
  return normalized;
}

function validIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validatePreadmissionDraft(input: PreadmissionDraft): PreadmissionDraft {
  const clientSubmissionId = String(input?.clientSubmissionId ?? "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientSubmissionId)) {
    throw new Error("提交标识无效，请刷新页面后重试");
  }
  const patientId = requiredText(input?.patientId, "患者标识", 64);
  const contactPhone = String(input?.contactPhone ?? "").replace(/\s+/g, "").trim();
  if (!/^[0-9+()\-]{5,30}$/.test(contactPhone)) throw new Error("联系方式格式不正确");
  const plannedAdmissionDate = String(input?.plannedAdmissionDate ?? "").trim();
  if (!plannedAdmissionDate) throw new Error("请选择计划住院日期");
  if (!validIsoDate(plannedAdmissionDate)) throw new Error("计划住院日期格式不正确");
  const intendedDepartment = requiredText(input?.intendedDepartment, "拟入科室", 60);
  const mainProblem = requiredText(input?.mainProblem, "主要问题", 500);
  const contactResult = String(input?.contactResult ?? "") as ContactResult;
  if (!allowedContactResults.has(contactResult)) throw new Error("请选择联系结果");
  const notes = optionalText(input?.notes, "备注", 500);
  return {
    clientSubmissionId,
    patientId,
    contactPhone,
    plannedAdmissionDate,
    intendedDepartment,
    mainProblem,
    contactResult,
    notes,
  };
}

function shortDate(value?: string) {
  if (!value || !validIsoDate(value)) return "日期未记录";
  return `${value.slice(5, 7)}月${value.slice(8, 10)}日`;
}

function shanghaiDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间待核实";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

export function buildPreadmissionMarkdown(model: PreadmissionMessageModel) {
  const latestStay = model.latestAdmissionDate
    ? `${shortDate(model.latestAdmissionDate)} 至 ${shortDate(model.latestDischargeDate)}`
    : "无可用记录";
  const age = Number.isInteger(model.age) && Number(model.age) >= 0 ? `${model.age} 岁` : "年龄未记录";
  return [
    "### 建始民族医院｜预住院登记",
    "",
    `**登记编号**：${safeInline(model.recordId, 40)}`,
    `**患者姓名**：${safeInline(model.patientName, 40)}`,
    `**联系电话**：${safeInline(model.contactPhone, 30)}`,
    `**基本信息**：${safeInline(model.sex, 10) || "未记录"}｜${age}`,
    `**既往住院**：${Math.max(0, Math.floor(Number(model.admissionCount) || 0))} 次｜最近 ${latestStay}`,
    "",
    `**计划住院日期**：${safeInline(model.plannedAdmissionDate, 10)}`,
    `**拟入科室**：${safeInline(model.intendedDepartment, 60)}`,
    `**主要问题**：${safeInline(model.mainProblem, 500)}`,
    `**联系结果**：${contactResults[model.contactResult] || "其他"}`,
    "",
    `**登记人员**：${safeInline(model.createdByName, 40)}`,
    `**登记时间**：${shanghaiDateTime(model.createdAt)}`,
    "**当前状态**：预住院线索，待医务人员确认",
  ].join("\n");
}

export function notificationStatusLabel(status: NotificationStatus) {
  const labels: Record<NotificationStatus, string> = {
    sent: "已推送",
    failed: "登记已保存，群推送失败",
    not_configured: "登记已保存，群机器人未配置",
    pending: "登记已保存，等待推送",
  };
  return labels[status];
}

export function contactResultLabel(value: ContactResult) {
  return contactResults[value];
}
