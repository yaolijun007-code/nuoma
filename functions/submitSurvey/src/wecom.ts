import type { PersistedSubmission } from "../../../src/domain/submission";
import { maleHealthV1 } from "../../../src/domain/questionnaire";
import { findHospitalQuestion } from "../../../src/hospital/surveyDefinition";
import NodeFormData from "form-data";
import { findFemaleQuestion } from "../../../src/female/surveyDefinition";

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export const WECOM_UPLOAD_TIMEOUT_MS = 15_000;

export class WeComDeliveryError extends Error {
  constructor(message: string, public readonly deliveryCode: string) {
    super(message);
    this.name = "WeComDeliveryError";
  }
}

function safeInline(value: string) {
  return value.replace(/[\r\n<>`\[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

function displayPhone(phone?: string) {
  if (!phone || !/^1\d{10}$/.test(phone)) return "未提供";
  return phone;
}

const hospitalConcernLabelMap = new Map(
  findHospitalQuestion("topConcerns")?.options?.map((option) => [option.value, option.label]) ?? [],
);
const hospitalMainChangeLabelMap = new Map(
  findHospitalQuestion("mainChange")?.options?.map((option) => [option.value, option.label]) ?? [],
);
const concernMarkers = ["①", "②", "③"];

function hospitalConcernLabels(record: PersistedSubmission) {
  const selected = record.healthAnswers.topConcerns;
  if (!Array.isArray(selected)) return "未填写";
  const labels = [...new Set(selected.map(String))]
    .map((value) => hospitalConcernLabelMap.get(value))
    .filter((value): value is string => Boolean(value))
    .slice(0, 3)
    .map(safeInline);
  return labels.length ? labels.map((label, index) => `${concernMarkers[index]} ${label}`).join("　") : "未填写";
}

function answerLabel(labels: Map<string, string>, value: unknown) {
  return labels.get(String(value ?? "")) ?? "未填写";
}

function primaryGoalLabel(record: PersistedSubmission) {
  const selected = record.healthAnswers.topConcerns;
  const goal = String(record.healthAnswers.singleImprovement ?? "");
  if (!Array.isArray(selected) || !selected.map(String).includes(goal)) return "未填写";
  return answerLabel(hospitalConcernLabelMap, goal);
}

function followUpStatus(record: PersistedSubmission) {
  if (record.session.hasRedFlag) return '<font color="warning">需医务人员优先核实</font>';
  const evaluate = record.assessment.domains.filter(({ level }) => level === "evaluate").length;
  const signal = record.assessment.domains.filter(({ level }) => level === "signal").length;
  if (evaluate >= 2) return '<font color="warning">建议重点跟进</font>';
  if (evaluate + signal > 0) return '<font color="comment">存在变化信号</font>';
  return '<font color="info">常规健康管理</font>';
}

function statusOverview(record: PersistedSubmission) {
  if (record.session.hasRedFlag) return '<font color="warning">安全信息待人工核实</font>';
  const count = (level: "evaluate" | "signal" | "stable") =>
    record.assessment.domains.filter((domain) => domain.level === level).length;
  return [
    `<font color="warning">评估 ${count("evaluate")}</font>`,
    `<font color="comment">变化 ${count("signal")}</font>`,
    `<font color="info">稳定 ${count("stable")}</font>`,
  ].join("｜");
}

function shanghaiSubmittedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间待核实";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date).map((part) => [part.type, part.value]),
  );
  return `${parts.month}月${parts.day}日 ${parts.hour}:${parts.minute}`;
}

export function buildWeComMarkdown(record: PersistedSubmission) {
  return [
    "### 🏥 建始民族医院｜新健康问卷",
    "",
    `🚦 **跟进等级**：${followUpStatus(record)}`,
    "",
    `👤 **姓名**：${safeInline(record.identity.name)}`,
    `📱 **手机号**：${displayPhone(record.identity.phone)}`,
    `🎯 **主要问题**：${hospitalConcernLabels(record)}`,
    `🔎 **最明显变化**：${answerLabel(hospitalMainChangeLabelMap, record.healthAnswers.mainChange)}`,
    `⭐ **首要改善目标**：${primaryGoalLabel(record)}`,
    "",
    `📊 **状态概览**：${statusOverview(record)}`,
    "",
    `🕒 **提交时间**：${shanghaiSubmittedAt(record.session.submittedAt)}`,
    `🧾 **记录编号**：${safeInline(record.session.confirmationId)}`,
  ].join("\n");
}

const femalePriorityLabelMap = new Map(
  findFemaleQuestion("f53")?.options?.map((option) => [option.value, option.label]) ?? [],
);
const femaleLifecycleLabelMap = new Map(
  findFemaleQuestion("f5")?.options?.map((option) => [option.value, option.label]) ?? [],
);

function femalePriorityLabels(record: PersistedSubmission) {
  const selected = record.healthAnswers.f53;
  if (!Array.isArray(selected)) return "未填写";
  const labels = [...new Set(selected.map(String))]
    .map((value) => femalePriorityLabelMap.get(value))
    .filter((value): value is string => Boolean(value))
    .slice(0, 3)
    .map(safeInline);
  return labels.length ? labels.map((label, index) => `${concernMarkers[index]} ${label}`).join("　") : "未填写";
}

function femaleHealthRating(record: PersistedSubmission) {
  const value = Number(record.healthAnswers.f55);
  return Number.isInteger(value) && value >= 0 && value <= 10 ? `${value} / 10` : "未填写";
}

export function buildFemaleWeComMarkdown(record: PersistedSubmission) {
  return [
    "### 🌺 建始民族医院｜女性健康问卷",
    "",
    `🚦 **跟进等级**：${followUpStatus(record)}`,
    "",
    `👤 **姓名**：${safeInline(record.identity.name)}`,
    `📱 **手机号**：${displayPhone(record.identity.phone)}`,
    `🎯 **重点关注**：${femalePriorityLabels(record)}`,
    `🌿 **生命周期**：${answerLabel(femaleLifecycleLabelMap, record.healthAnswers.f5)}`,
    `✨ **整体健康自评**：${femaleHealthRating(record)}`,
    "",
    `📊 **八维概览**：${statusOverview(record)}`,
    "",
    `🕒 **提交时间**：${shanghaiSubmittedAt(record.session.submittedAt)}`,
    `🧾 **记录编号**：${safeInline(record.session.confirmationId)}`,
  ].join("\n");
}

const twelveWeekGoalLabels = new Map(
  maleHealthV1.sections
    .flatMap((section) => section.questions)
    .find((question) => question.id === "twelveWeekGoals")
    ?.options?.map((option) => [option.value, option.label]) ?? [],
);

function domainTitles(record: PersistedSubmission, level: "evaluate" | "signal") {
  const titles = record.assessment.domains
    .filter((domain) => domain.level === level)
    .map((domain) => safeInline(domain.title));
  return titles.length ? titles.join("、") : "无";
}

function selectedGoalLabels(record: PersistedSubmission) {
  const selected = record.healthAnswers.twelveWeekGoals;
  if (!Array.isArray(selected)) return "未填写";
  const labels = selected
    .slice(0, 3)
    .map((value) => twelveWeekGoalLabels.get(String(value)))
    .filter((value): value is string => Boolean(value))
    .map(safeInline);
  return labels.length ? labels.join("、") : "未填写";
}

export function buildNuomaYuanyiWeComMarkdown(record: PersistedSubmission) {
  const safetyStatus = record.session.hasRedFlag
    ? '<font color="warning">存在医学安全红旗，需优先人工核实</font>'
    : '<font color="info">未发现医学安全红旗</font>';
  return [
    "### 诺玛元一｜新问卷概要",
    `> 安全状态：${safetyStatus}`,
    `> 记录编号：${safeInline(record.session.confirmationId)}`,
    `> 提交时间：${safeInline(record.session.submittedAt)}`,
    "",
    `**建议进一步评估**：${domainTitles(record, "evaluate")}`,
    `**存在变化信号**：${domainTitles(record, "signal")}`,
    `**12周目标**：${selectedGoalLabels(record)}`,
    "",
    "群内仅展示脱敏概要，请凭记录编号在受保护系统内核实完整信息。",
  ].join("\n");
}

function validateWebhook(webhookUrl: string) {
  let url: URL;
  try {
    url = new URL(webhookUrl);
  } catch {
    throw new Error("企业微信通知地址无效");
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== "qyapi.weixin.qq.com" ||
    url.pathname !== "/cgi-bin/webhook/send" ||
    !url.searchParams.get("key")
  ) {
    throw new Error("企业微信通知地址无效");
  }
  return url;
}

export async function sendWeComNotification(webhookUrl: string, markdown: string, fetcher: Fetcher = fetch) {
  const url = validateWebhook(webhookUrl);
  try {
    const response = await fetcher(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ msgtype: "markdown", markdown: { content: markdown } }),
      signal: AbortSignal.timeout(5_000),
    });
    const result = await response.json() as { errcode?: number };
    if (!response.ok || result.errcode !== 0) throw new Error("rejected");
  } catch {
    throw new Error("企业微信通知失败");
  }
}

export async function uploadWeComFile(
  webhookUrl: string,
  filename: string,
  file: Buffer,
  fetcher: Fetcher = fetch,
) {
  const webhook = validateWebhook(webhookUrl);
  const uploadUrl = new URL("/cgi-bin/webhook/upload_media", webhook.origin);
  uploadUrl.searchParams.set("key", webhook.searchParams.get("key")!);
  uploadUrl.searchParams.set("type", "file");

  try {
    const form = new NodeFormData();
    form.append("media", file, {
      filename,
      contentType: "application/octet-stream",
      knownLength: file.length,
    });
    const multipartBody = form.getBuffer();
    const headers = {
      ...form.getHeaders(),
      "content-length": String(multipartBody.length),
    };
    const response = await fetcher(uploadUrl, {
      method: "POST",
      headers,
      body: new Uint8Array(multipartBody),
      signal: AbortSignal.timeout(WECOM_UPLOAD_TIMEOUT_MS),
    });
    const result = await response.json() as { errcode?: number; media_id?: string };
    if (!response.ok) throw new WeComDeliveryError("企业微信文件上传失败", `http_${response.status}`);
    if (result.errcode !== 0) {
      throw new WeComDeliveryError("企业微信文件上传失败", `api_${result.errcode ?? "unknown"}`);
    }
    if (!result.media_id) throw new WeComDeliveryError("企业微信文件上传失败", "missing_media_id");
    return result.media_id;
  } catch (error) {
    if (error instanceof WeComDeliveryError) throw error;
    throw new WeComDeliveryError("企业微信文件上传失败", "network_or_parse");
  }
}

export async function sendWeComFile(webhookUrl: string, mediaId: string, fetcher: Fetcher = fetch) {
  const url = validateWebhook(webhookUrl);
  try {
    const response = await fetcher(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ msgtype: "file", file: { media_id: mediaId } }),
      signal: AbortSignal.timeout(5_000),
    });
    const result = await response.json() as { errcode?: number };
    if (!response.ok || result.errcode !== 0) throw new Error("rejected");
  } catch {
    throw new Error("企业微信文件发送失败");
  }
}
