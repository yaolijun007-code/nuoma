var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// functions/adminSurvey/src/index.ts
var index_exports = {};
__export(index_exports, {
  main: () => main
});
module.exports = __toCommonJS(index_exports);
var import_node_sdk = require("@cloudbase/node-sdk");

// src/domain/admin.ts
var AdminAuthorizationError = class extends Error {
};
var statuses = /* @__PURE__ */ new Set(["new", "verified", "referred", "closed"]);
function createAdminService(repository2, allowedUids2) {
  const authorize = (uid) => {
    if (!uid || !allowedUids2.has(uid)) throw new AdminAuthorizationError("\u65E0\u6743\u8BBF\u95EE\u5065\u5EB7\u7BA1\u7406\u6570\u636E");
  };
  return {
    async list(uid, requestedLimit = 20) {
      authorize(uid);
      const limit = Math.max(1, Math.min(50, Number(requestedLimit) || 20));
      const records = await repository2.list(limit);
      return [...records].sort((a, b) => Number(b.hasRedFlag) - Number(a.hasRedFlag) || b.submittedAt.localeCompare(a.submittedAt));
    },
    async detail(uid, confirmationId) {
      authorize(uid);
      if (!/^JS-[A-Z0-9-]+$/.test(confirmationId)) throw new Error("\u786E\u8BA4\u7F16\u53F7\u65E0\u6548");
      return repository2.detail(confirmationId);
    },
    async updateStatus(uid, confirmationId, status) {
      authorize(uid);
      if (!statuses.has(status)) throw new Error("\u5904\u7406\u72B6\u6001\u65E0\u6548");
      await repository2.updateStatus(confirmationId, status, uid);
    }
  };
}

// src/domain/collections.ts
var collections = {
  sessions: "health_survey_sessions",
  profiles: "health_respondent_profiles",
  answers: "health_survey_answers",
  assessments: "health_assessment_results",
  auditLogs: "health_audit_logs"
};

// functions/adminSurvey/src/index.ts
var app = (0, import_node_sdk.init)();
var db = app.database();
var command = db.command;
var repository = {
  async list(limit) {
    const sessions = await db.collection(collections.sessions).orderBy("submittedAt", "desc").limit(limit).get();
    const ids = sessions.data.map((record) => record._id);
    if (!ids.length) return [];
    const profiles = await db.collection(collections.profiles).where({ sessionId: command.in(ids) }).get();
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
        phone: profile.phone || "",
        phoneLast4: profile.phoneLast4 || ""
      };
    });
  },
  async detail(confirmationId) {
    const sessions = await db.collection(collections.sessions).where({ confirmationId }).limit(1).get();
    const session = sessions.data[0];
    if (!session) return null;
    const [profiles, answers, results] = await Promise.all([
      db.collection(collections.profiles).where({ sessionId: session._id }).limit(1).get(),
      db.collection(collections.answers).where({ sessionId: session._id }).limit(1).get(),
      db.collection(collections.assessments).where({ sessionId: session._id }).limit(1).get()
    ]);
    return { session, identity: profiles.data[0] || null, answers: answers.data[0]?.answers || null, assessment: results.data[0]?.assessment || null };
  },
  async updateStatus(confirmationId, status, adminUid) {
    const sessions = await db.collection(collections.sessions).where({ confirmationId }).limit(1).get();
    const session = sessions.data[0];
    if (!session) throw new Error("\u8BB0\u5F55\u4E0D\u5B58\u5728");
    await Promise.all([
      db.collection(collections.sessions).doc(session._id).update({ status, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }),
      db.collection(collections.auditLogs).add({ sessionId: session._id, action: "status_update", status, adminUid, createdAt: (/* @__PURE__ */ new Date()).toISOString() })
    ]);
  }
};
var allowedUids = new Set((process.env.ADMIN_UIDS || "").split(",").map((value) => value.trim()).filter(Boolean));
var service = createAdminService(repository, allowedUids);
function json(statusCode, body) {
  return { statusCode, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, body: JSON.stringify(body) };
}
async function main(event, context) {
  try {
    const uid = (0, import_node_sdk.getCloudbaseContext)(context).TCB_UUID || "";
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body || {};
    const input = body;
    const action = String(input.action || "list");
    if (action === "list") return json(200, { records: await service.list(uid, Number(input.limit || 20)) });
    if (action === "detail") return json(200, { record: await service.detail(uid, String(input.confirmationId || "")) });
    if (action === "updateStatus") {
      await service.updateStatus(uid, String(input.confirmationId || ""), String(input.status || ""));
      return json(200, { ok: true });
    }
    return json(400, { error: "\u64CD\u4F5C\u7C7B\u578B\u65E0\u6548" });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return json(403, { error: error.message });
    console.error("adminSurvey failed", error instanceof Error ? error.message : "unknown error");
    return json(400, { error: error instanceof Error ? error.message : "\u8BF7\u6C42\u5931\u8D25" });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  main
});
