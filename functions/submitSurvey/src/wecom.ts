import type { PersistedSubmission } from "../../../src/domain/submission";

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

function safeInline(value: string) {
  return value.replace(/[\r\n<>`\[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

function maskPhone(phone?: string) {
  if (!phone || !/^1\d{10}$/.test(phone)) return "未提供";
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

export function buildWeComMarkdown(record: PersistedSubmission) {
  const status = record.session.hasRedFlag
    ? '<font color="warning">建议优先人工确认</font>'
    : '<font color="info">已完成采集</font>';
  return [
    "### 建始民族医院｜新健康问卷",
    `> 提交状态：${status}`,
    `> 姓名：${safeInline(record.identity.name)}`,
    `> 手机：${maskPhone(record.identity.phone)}`,
    `> 记录编号：${safeInline(record.session.confirmationId)}`,
    `> 提交时间：${safeInline(record.session.submittedAt)}`,
    "",
    "请在院内系统核实完整信息；群内通知不展示具体健康答案。",
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
