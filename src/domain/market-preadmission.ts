export type MarketRole = "market" | "admin";
export type PatientQueryKind = "name" | "phone" | "hospitalNo" | "patientId";
export type NotificationStatus = "pending" | "sending" | "sent" | "failed" | "not_configured" | "delivery_unknown";
export type ContactResult = "patient_interested" | "family_interested" | "considering" | "no_answer" | "declined" | "other";

export const patientTypeOptions = [
  "城镇职工医保",
  "低保人员医保",
  "普通居民医保",
  "特困供养人员医保",
  "自费",
] as const;

export const intendedDepartmentOptions = [
  "风湿免疫科",
  "康复科",
  "老年医学科",
  "住院内一科",
  "住院外一科",
] as const;

export type PatientType = typeof patientTypeOptions[number];
export type IntendedDepartment = typeof intendedDepartmentOptions[number];

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

export interface NewPatientDraft {
  name: string;
  sex: string;
  age: number | null;
}

export interface PreadmissionDraft {
  clientSubmissionId: string;
  patientId: string;
  contactPhone: string;
  patientType: PatientType;
  plannedAdmissionDate: string;
  intendedDepartment: IntendedDepartment;
  mainProblem: string;
  contactResult: ContactResult;
  notes: string;
  newPatient?: NewPatientDraft;
}

export interface PreadmissionRecord {
  recordId: string;
  clientSubmissionId: string;
  patientId: string;
  patientName: string;
  patientSnapshot: {
    patientCode: string;
    hospitalNo: string;
    sex: string;
    age: number | null;
    admissionCount: number;
    latestAdmissionDate?: string;
    latestDischargeDate?: string;
  };
  contactPhone: string;
  patientType: PatientType;
  plannedAdmissionDate: string;
  intendedDepartment: IntendedDepartment;
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

export type PreadmissionListItem = Pick<PreadmissionRecord,
  "recordId" | "patientName" | "plannedAdmissionDate" | "contactResult" | "createdAt" | "notificationStatus"
>;

export interface PreadmissionMessageModel {
  recordId: string;
  patientName: string;
  contactPhone: string;
  sex: string;
  age: number | null;
  admissionCount: number;
  latestAdmissionDate?: string;
  latestDischargeDate?: string;
  patientType: PatientType;
  plannedAdmissionDate: string;
  intendedDepartment: IntendedDepartment;
  mainProblem: string;
  contactResult: ContactResult;
  notes: string;
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

const contactMessagePresentation: Record<ContactResult, {
  color: "info" | "warning" | "comment";
  label: string;
}> = {
  patient_interested: { color: "info", label: "有效意向线索｜建议优先确认" },
  family_interested: { color: "info", label: "有效意向线索｜建议优先确认" },
  considering: { color: "warning", label: "待持续跟进｜请安排下一次联系" },
  no_answer: { color: "warning", label: "待持续跟进｜请安排下一次联系" },
  declined: { color: "comment", label: "已完成触达记录｜感谢完成真实记录" },
  other: { color: "comment", label: "已完成触达记录｜感谢完成真实记录" },
};

const wecomMarkdownMaxBytes = 4096;
const textEncoder = new TextEncoder();

const allowedContactResults = new Set(Object.keys(contactResults));
const allowedPatientTypes = new Set<string>(patientTypeOptions);
const allowedIntendedDepartments = new Set<string>(intendedDepartmentOptions);

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
  const patientId = optionalText(input?.patientId, "患者标识", 64);
  let newPatient: NewPatientDraft | undefined;
  if (input?.newPatient) {
    const name = requiredText(input.newPatient.name, "新患者姓名", 40);
    const sex = optionalText(input.newPatient.sex, "新患者性别", 10);
    if (sex && !["男", "女", "其他", "不详"].includes(sex)) throw new Error("新患者性别无效");
    const age = input.newPatient.age === null || input.newPatient.age === undefined
      ? null
      : Number(input.newPatient.age);
    if (age !== null && (!Number.isInteger(age) || age < 0 || age > 120)) throw new Error("新患者年龄应为 0 至 120 岁");
    newPatient = { name, sex, age };
  }
  if (!patientId && !newPatient) throw new Error("请选择历史患者或填写新患者资料");
  if (patientId && newPatient) throw new Error("历史患者与新患者资料不能同时提交");
  const contactPhone = String(input?.contactPhone ?? "").replace(/\s+/g, "").trim();
  if (!/^[0-9+()\-]{5,30}$/.test(contactPhone)) throw new Error("联系方式格式不正确");
  const patientType = safeInline(input?.patientType, 30);
  if (!patientType) throw new Error("请选择患者类型");
  if (!allowedPatientTypes.has(patientType)) throw new Error("患者类型无效");
  const plannedAdmissionDate = String(input?.plannedAdmissionDate ?? "").trim();
  if (!plannedAdmissionDate) throw new Error("请选择计划住院日期");
  if (!validIsoDate(plannedAdmissionDate)) throw new Error("计划住院日期格式不正确");
  const intendedDepartment = safeInline(input?.intendedDepartment, 30);
  if (!intendedDepartment) throw new Error("请选择拟住院科室");
  if (!allowedIntendedDepartments.has(intendedDepartment)) throw new Error("拟住院科室无效");
  const mainProblem = requiredText(input?.mainProblem, "主要问题", 500);
  const contactResult = String(input?.contactResult ?? "") as ContactResult;
  if (!allowedContactResults.has(contactResult)) throw new Error("请选择联系结果");
  const notes = optionalText(input?.notes, "备注", 500);
  return {
    clientSubmissionId,
    patientId,
    contactPhone,
    patientType: patientType as PatientType,
    plannedAdmissionDate,
    intendedDepartment: intendedDepartment as IntendedDepartment,
    mainProblem,
    contactResult,
    notes,
    ...(newPatient ? { newPatient } : {}),
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

function utf8ByteLength(value: string) {
  return textEncoder.encode(value).byteLength;
}

function truncateUtf8(value: string, maxBytes: number) {
  if (utf8ByteLength(value) <= maxBytes) return value;
  const ellipsis = "…";
  const contentBudget = maxBytes - utf8ByteLength(ellipsis);
  if (contentBudget <= 0) return "";
  const output: string[] = [];
  let usedBytes = 0;
  for (const character of value) {
    const characterBytes = utf8ByteLength(character);
    if (usedBytes + characterBytes > contentBudget) break;
    output.push(character);
    usedBytes += characterBytes;
  }
  return `${output.join("")}${ellipsis}`;
}

export function buildPreadmissionMarkdown(model: PreadmissionMessageModel) {
  const latestStay = model.latestAdmissionDate
    ? `${shortDate(model.latestAdmissionDate)} 至 ${shortDate(model.latestDischargeDate)}`
    : "无可用记录";
  const age = Number.isInteger(model.age) && Number(model.age) >= 0 ? `${model.age} 岁` : "年龄未记录";
  const presentation = contactMessagePresentation[model.contactResult] ?? contactMessagePresentation.other;
  const mainProblem = safeInline(model.mainProblem, 500);
  const notes = safeInline(model.notes, 500) || "未填写";
  const render = (safeMainProblem: string, safeNotes: string) => [
    "### 🎯 新增预住院线索",
    "",
    `<font color="${presentation.color}">● ${presentation.label}</font>`,
    "",
    `**患者姓名**：${safeInline(model.patientName, 40)}`,
    `**联系电话**：${safeInline(model.contactPhone, 30)}`,
    `**基本信息**：${safeInline(model.sex, 10) || "未记录"}｜${age}`,
    `**既往住院**：${Math.max(0, Math.floor(Number(model.admissionCount) || 0))} 次｜最近 ${latestStay}`,
    `**患者类型**：${safeInline(model.patientType, 30) || "未记录"}`,
    "",
    `**计划住院日期**：${safeInline(model.plannedAdmissionDate, 10)}`,
    `**拟住院科室**：${safeInline(model.intendedDepartment, 30)}`,
    `**主要问题**：${safeMainProblem}`,
    `**联系结果**：${contactResults[model.contactResult] || "其他"}`,
    `**备注**：${safeNotes}`,
    "",
    `🌟 **登记人员**：${safeInline(model.createdByName, 40)}`,
    '<font color="comment">感谢及时登记，请继续保持完整记录。</font>',
    "",
    `**登记编号**：${safeInline(model.recordId, 40)}`,
    `**登记时间**：${shanghaiDateTime(model.createdAt)}`,
    "**当前状态**：待医务人员确认",
  ].join("\n");

  const fullMessage = render(mainProblem, notes);
  if (utf8ByteLength(fullMessage) <= wecomMarkdownMaxBytes) return fullMessage;

  const flexibleBudget = Math.max(0, wecomMarkdownMaxBytes - utf8ByteLength(render("", "")));
  const mainProblemBytes = utf8ByteLength(mainProblem);
  const notesBytes = utf8ByteLength(notes);
  let mainProblemBudget = Math.floor(flexibleBudget * 0.55);
  let notesBudget = flexibleBudget - mainProblemBudget;
  if (mainProblemBytes < mainProblemBudget) {
    notesBudget += mainProblemBudget - mainProblemBytes;
    mainProblemBudget = mainProblemBytes;
  }
  if (notesBytes < notesBudget) {
    mainProblemBudget += notesBudget - notesBytes;
    notesBudget = notesBytes;
  }
  return render(
    truncateUtf8(mainProblem, mainProblemBudget),
    truncateUtf8(notes, notesBudget),
  );
}

export function notificationStatusLabel(status: NotificationStatus) {
  const labels: Record<NotificationStatus, string> = {
    sent: "已推送",
    failed: "登记已保存，群推送失败",
    not_configured: "登记已保存，群机器人未配置",
    pending: "登记已保存，等待推送",
    sending: "群推送处理中，请勿重复操作",
    delivery_unknown: "群端结果待人工核对，请勿直接重试",
  };
  return labels[status];
}

export function contactResultLabel(value: ContactResult) {
  return contactResults[value];
}
