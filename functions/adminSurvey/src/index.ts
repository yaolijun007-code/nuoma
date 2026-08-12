import { getCloudbaseContext, init, SYMBOL_CURRENT_ENV } from "@cloudbase/node-sdk";
import { AdminAuthorizationError, createAdminService, type WorkflowStatus } from "../../../src/domain/admin";

const app = init({ env: SYMBOL_CURRENT_ENV });
const db = app.database();
const command = db.command;

const repository = {
  async list(limit: number) {
    const sessions = await db.collection("survey_sessions").orderBy("submittedAt", "desc").limit(limit).get();
    const ids = sessions.data.map((record) => record._id);
    if (!ids.length) return [];
    const profiles = await db.collection("respondent_profiles").where({ sessionId: command.in(ids) }).get();
    const profileBySession = new Map(profiles.data.map((profile) => [profile.sessionId, profile]));
    return sessions.data.map((session) => {
      const profile = profileBySession.get(session._id) || {};
      return {
        confirmationId: session.confirmationId,
        submittedAt: session.submittedAt,
        hasRedFlag: Boolean(session.hasRedFlag),
        status: session.status || "new",
        name: profile.name || "",
        age: profile.age || "",
        phoneLast4: profile.phoneLast4 || "",
      };
    });
  },
  async detail(confirmationId: string) {
    const sessions = await db.collection("survey_sessions").where({ confirmationId }).limit(1).get();
    const session = sessions.data[0];
    if (!session) return null;
    const [profiles, answers, results] = await Promise.all([
      db.collection("respondent_profiles").where({ sessionId: session._id }).limit(1).get(),
      db.collection("survey_answers").where({ sessionId: session._id }).limit(1).get(),
      db.collection("assessment_results").where({ sessionId: session._id }).limit(1).get(),
    ]);
    return { session, identity: profiles.data[0] || null, answers: answers.data[0]?.answers || null, assessment: results.data[0]?.assessment || null };
  },
  async updateStatus(confirmationId: string, status: WorkflowStatus, adminUid: string) {
    const sessions = await db.collection("survey_sessions").where({ confirmationId }).limit(1).get();
    const session = sessions.data[0];
    if (!session) throw new Error("记录不存在");
    await Promise.all([
      db.collection("survey_sessions").doc(session._id).update({ status, updatedAt: new Date().toISOString() }),
      db.collection("audit_logs").add({ data: { sessionId: session._id, action: "status_update", status, adminUid, createdAt: new Date().toISOString() } }),
    ]);
  },
};

const allowedUids = new Set((process.env.ADMIN_UIDS || "").split(",").map((value) => value.trim()).filter(Boolean));
const service = createAdminService(repository, allowedUids);

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, body: JSON.stringify(body) };
}

export async function main(event: Record<string, unknown>, context: unknown) {
  try {
    const uid = getCloudbaseContext(context as never).TCB_UUID || "";
    const body = typeof event.body === "string" ? JSON.parse(event.body) : (event.body || {});
    const input = body as Record<string, unknown>;
    const action = String(input.action || "list");
    if (action === "list") return json(200, { records: await service.list(uid, Number(input.limit || 20)) });
    if (action === "detail") return json(200, { record: await service.detail(uid, String(input.confirmationId || "")) });
    if (action === "updateStatus") {
      await service.updateStatus(uid, String(input.confirmationId || ""), String(input.status || ""));
      return json(200, { ok: true });
    }
    return json(400, { error: "操作类型无效" });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return json(403, { error: error.message });
    console.error("adminSurvey failed", error instanceof Error ? error.message : "unknown error");
    return json(400, { error: error instanceof Error ? error.message : "请求失败" });
  }
}

