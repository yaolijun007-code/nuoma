import { MarketServiceError } from "./service";

const actions = new Set([
  "getSession",
  "searchPatients",
  "getPatientHistory",
  "createPreadmission",
  "listPreadmissions",
  "retryNotification",
]);

export function parseMarketRequest(event: Record<string, unknown>) {
  let input: unknown = event;
  if ("body" in event) {
    try {
      input = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    } catch {
      throw new MarketServiceError("INVALID_INPUT", "请求内容格式无效");
    }
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new MarketServiceError("INVALID_INPUT", "请求内容格式无效");
  }
  const request = input as Record<string, unknown>;
  const action = String(request.action ?? "");
  if (!actions.has(action)) throw new MarketServiceError("INVALID_ACTION", "操作类型无效");
  return request as Record<string, unknown> & { action: string };
}
