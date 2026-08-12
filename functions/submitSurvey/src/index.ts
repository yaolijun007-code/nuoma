import { init, SYMBOL_CURRENT_ENV } from "@cloudbase/node-sdk";
import { createSubmissionService, SubmissionError, type PersistedSubmission } from "../../../src/domain/submission";

const app = init({ env: SYMBOL_CURRENT_ENV });
const db = app.database();

const persistence = {
  async find(clientSubmissionId: string) {
    const sessions = await db.collection("survey_sessions").where({ clientSubmissionId }).limit(1).get();
    const session = sessions.data[0];
    if (!session) return null;
    const results = await db.collection("assessment_results").where({ sessionId: session._id }).limit(1).get();
    const assessment = results.data[0]?.assessment;
    return assessment ? { confirmationId: session.confirmationId, assessment } : null;
  },
  async save(record: PersistedSubmission) {
    const sessionResult = await db.collection("survey_sessions").add({ data: record.session });
    const sessionId = sessionResult.id;
    await Promise.all([
      db.collection("respondent_profiles").add({ data: { sessionId, ...record.identity } }),
      db.collection("survey_answers").add({ data: { sessionId, answers: record.healthAnswers } }),
      db.collection("assessment_results").add({ data: { sessionId, assessment: record.assessment } }),
      db.collection("audit_logs").add({ data: { sessionId, action: "public_submission", createdAt: record.session.submittedAt } }),
    ]);
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
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
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

