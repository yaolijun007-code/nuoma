import { init, SYMBOL_CURRENT_ENV } from "@cloudbase/node-sdk";
import { createSubmissionService, SubmissionError, type PersistedSubmission } from "../../../src/domain/submission";
import { collections } from "../../../src/domain/collections";
import { resolveWeComNotification } from "./notification";
import { sendWeComNotification } from "./wecom";

const app = init({ env: SYMBOL_CURRENT_ENV });
const db = app.database();
const DEFAULT_ALLOWED_ORIGIN = "https://yuecheng-survey-d4fucklsf6b68aaf-1388047663.tcloudbaseapp.com";

const persistence = {
  async find(clientSubmissionId: string) {
    const sessions = await db.collection(collections.sessions).where({ clientSubmissionId }).limit(1).get();
    const session = sessions.data[0];
    if (!session) return null;
    const results = await db.collection(collections.assessments).where({ sessionId: session._id }).limit(1).get();
    const assessment = results.data[0]?.assessment;
    return assessment ? { confirmationId: session.confirmationId, assessment } : null;
  },
  async save(record: PersistedSubmission) {
    const sessionResult = await db.collection(collections.sessions).add(record.session);
    const sessionId = sessionResult.id;
    await Promise.all([
      db.collection(collections.profiles).add({ sessionId, ...record.identity }),
      db.collection(collections.answers).add({ sessionId, answers: record.healthAnswers }),
      db.collection(collections.assessments).add({ sessionId, assessment: record.assessment }),
      db.collection(collections.auditLogs).add({ sessionId, action: "public_submission", createdAt: record.session.submittedAt }),
    ]);

    const notification = resolveWeComNotification(record, process.env);
    if (notification) {
      let notificationStatus = "not_configured";
      if (notification.webhookUrl) {
        try {
          await sendWeComNotification(notification.webhookUrl, notification.markdown);
          notificationStatus = "sent";
        } catch {
          notificationStatus = "failed";
          console.error(notification.failureLog);
        }
      }
      try {
        await db.collection(collections.auditLogs).add({
          sessionId,
          action: notification.auditAction,
          status: notificationStatus,
          createdAt: new Date().toISOString(),
        });
      } catch {
        console.error("WeCom notification audit write failed");
      }
    }
  },
};

const service = createSubmissionService(persistence);

function response(statusCode: number, body: unknown, origin = "*") {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST,OPTIONS",
      "access-control-allow-headers": "content-type",
      "cache-control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

export async function main(event: Record<string, unknown>) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || DEFAULT_ALLOWED_ORIGIN;
  const requestContext = event.requestContext as Record<string, unknown> | undefined;
  const method = String(event.httpMethod ?? requestContext?.httpMethod ?? "POST").toUpperCase();
  if (method === "OPTIONS") return response(204, {}, allowedOrigin);
  if (method !== "POST") return response(405, { error: "仅支持POST提交" }, allowedOrigin);

  try {
    const rawBody = event.body;
    const payload = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
    return response(200, await service.submit(payload), allowedOrigin);
  } catch (error) {
    if (error instanceof SubmissionError) {
      return response(error.code === "BOT_REJECTED" ? 403 : 400, { error: error.message, code: error.code }, allowedOrigin);
    }
    console.error("submitSurvey failed", error instanceof Error ? error.message : "unknown error");
    return response(500, { error: "暂时无法提交，请稍后重试", code: "INTERNAL_ERROR" }, allowedOrigin);
  }
}
