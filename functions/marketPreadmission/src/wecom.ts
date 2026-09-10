import type { PreadmissionMessageModel } from "../../../src/domain/market-preadmission";

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export class WeComNotificationError extends Error {
  constructor(public readonly code: string) {
    super("企业微信群推送失败");
    this.name = "WeComNotificationError";
  }
}

export function validateWeComWebhook(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.hostname === ["qyapi", "weixin", "qq", "com"].join(".")
      && url.pathname === "/cgi-bin/webhook/send"
      && Boolean(url.searchParams.get("key"));
  } catch {
    return false;
  }
}

export function createWeComNotifier(
  getWebhook: () => string = () => process.env.JSMZ_PREADMISSION_WECOM_WEBHOOK_URL || "",
  fetcher: Fetcher = fetch,
) {
  return {
    async send(_model: PreadmissionMessageModel, markdown: string) {
      const webhook = getWebhook().trim();
      if (!webhook) return { status: "not_configured" as const };
      if (!validateWeComWebhook(webhook)) throw new WeComNotificationError("INVALID_WEBHOOK");
      let response: Response;
      try {
        response = await fetcher(webhook, {
          method: "POST",
          headers: { "content-type": "application/json; charset=utf-8" },
          body: JSON.stringify({ msgtype: "markdown", markdown: { content: markdown } }),
          signal: AbortSignal.timeout(5_000),
        });
      } catch {
        throw new WeComNotificationError("NETWORK_ERROR");
      }
      let result: { errcode?: unknown };
      try {
        result = await response.json() as { errcode?: unknown };
      } catch {
        throw new WeComNotificationError(`HTTP_${response.status}`);
      }
      if (!response.ok) throw new WeComNotificationError(`HTTP_${response.status}`);
      if (Number(result.errcode) !== 0) {
        const upstream = String(result.errcode ?? "UNKNOWN").replace(/[^A-Z0-9_-]/gi, "").slice(0, 24) || "UNKNOWN";
        throw new WeComNotificationError(`WECOM_${upstream}`);
      }
      return { status: "sent" as const, responseCode: "0" };
    },
  };
}
