import { assessSurvey } from "./assessment";
import { maleHealthV1 } from "./questionnaire";
import type { AnswerMap, AssessmentResult } from "./types";
import { validateStep } from "./validation";
import { normalizeHospitalAnswers } from "../hospital/normalize";
import { hospitalSurvey } from "../hospital/surveyDefinition";
import { validateHospitalSubmission } from "../hospital/validation";
import { assessFemaleSurvey } from "../female/assessment";
import { normalizeFemaleAnswers } from "../female/normalize";
import { femaleSurvey } from "../female/surveyDefinition";
import { validateFemaleSubmission } from "../female/validation";

export interface SubmissionPayload {
  questionnaireVersion: string;
  clientSubmissionId: string;
  honeypot?: string;
  answers: AnswerMap;
}

export interface SubmissionResponse {
  confirmationId: string;
  assessment: AssessmentResult;
}

export interface PersistedSubmission {
  session: {
    clientSubmissionId: string;
    confirmationId: string;
    questionnaireVersion: string;
    submittedAt: string;
    hasRedFlag: boolean;
  };
  identity: { name: string; age: number | null; phone?: string; phoneLast4: string };
  healthAnswers: Record<string, unknown>;
  assessment: AssessmentResult;
}

export interface SubmissionPersistence {
  find(clientSubmissionId: string): Promise<SubmissionResponse | null>;
  save(record: PersistedSubmission): Promise<void>;
}

export class SubmissionError extends Error {
  constructor(public code: "INVALID_PAYLOAD" | "BOT_REJECTED", message: string) {
    super(message);
  }
}

const allowedAnswerIds = new Set([
  ...maleHealthV1.sections.flatMap((section) => section.questions.map((question) => question.id)),
  ...hospitalSurvey.pages.filter((page) => page.kind === "question").map((page) => page.id),
  ...femaleSurvey.pages.filter((page) => page.kind === "question").map((page) => page.id),
  "date",
]);
export const supportedQuestionnaireVersions = new Set([
  maleHealthV1.version,
  "nuoma-yuanyi-male-health-v1.0",
  femaleSurvey.version,
]);

function parsePayload(input: unknown): SubmissionPayload {
  if (!input || typeof input !== "object") throw new SubmissionError("INVALID_PAYLOAD", "提交内容格式不正确");
  const payload = input as Partial<SubmissionPayload>;
  if (payload.honeypot) throw new SubmissionError("BOT_REJECTED", "请求已拒绝");
  if (!payload.questionnaireVersion || !supportedQuestionnaireVersions.has(payload.questionnaireVersion)) {
    throw new SubmissionError("INVALID_PAYLOAD", "问卷版本不受支持");
  }
  if (!payload.clientSubmissionId || !/^[a-zA-Z0-9-]{16,64}$/.test(payload.clientSubmissionId)) {
    throw new SubmissionError("INVALID_PAYLOAD", "提交标识无效");
  }
  if (!payload.answers || typeof payload.answers !== "object" || Array.isArray(payload.answers)) {
    throw new SubmissionError("INVALID_PAYLOAD", "问卷答案格式不正确");
  }
  if (JSON.stringify(payload.answers).length > 50_000) {
    throw new SubmissionError("INVALID_PAYLOAD", "提交内容超出限制");
  }
  for (const [key, value] of Object.entries(payload.answers)) {
    if (!allowedAnswerIds.has(key)) continue;
    if (typeof value === "string" && value.length > 2_000) throw new SubmissionError("INVALID_PAYLOAD", "文本内容超出限制");
    if (Array.isArray(value) && (value.length > 20 || value.some((item) => typeof item !== "string" || item.length > 80))) {
      throw new SubmissionError("INVALID_PAYLOAD", "选项内容格式不正确");
    }
  }
  const femalePayload = payload.questionnaireVersion === femaleSurvey.version;
  const mobileHospitalPayload = !femalePayload && typeof payload.answers.phone === "string";
  const errors = femalePayload
    ? Object.values(validateFemaleSubmission(payload.answers))
    : mobileHospitalPayload
      ? Object.values(validateHospitalSubmission(payload.answers))
      : maleHealthV1.sections.flatMap((section) => Object.values(validateStep(section.id, payload.answers!)));
  if (errors.length) throw new SubmissionError("INVALID_PAYLOAD", "问卷尚未完整填写");
  return payload as SubmissionPayload;
}

function confirmationId() {
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
  return `JS-${Date.now().toString(36).toUpperCase()}-${suffix}`;
}

export function createSubmissionService(persistence: SubmissionPersistence) {
  return {
    async submit(input: unknown): Promise<SubmissionResponse> {
      const payload = parsePayload(input);
      const existing = await persistence.find(payload.clientSubmissionId);
      if (existing) return existing;

      const femalePayload = payload.questionnaireVersion === femaleSurvey.version;
      const mobileHospitalPayload = !femalePayload && typeof payload.answers.phone === "string";
      let identity: PersistedSubmission["identity"];
      let healthAnswers: Record<string, unknown>;
      let assessmentAnswers: AnswerMap;
      if (femalePayload) {
        const normalized = normalizeFemaleAnswers(payload.answers);
        identity = normalized.identity;
        healthAnswers = normalized.healthAnswers;
        assessmentAnswers = normalized.assessmentAnswers;
      } else if (mobileHospitalPayload) {
        const normalized = normalizeHospitalAnswers(payload.answers);
        identity = normalized.identity;
        healthAnswers = normalized.healthAnswers;
        assessmentAnswers = normalized.assessmentAnswers;
      } else {
        const sanitized = Object.fromEntries(
          Object.entries(payload.answers).filter(([id]) => allowedAnswerIds.has(id)),
        ) as AnswerMap;
        identity = {
          name: String(payload.answers.name).trim().slice(0, 80),
          age: Number(payload.answers.age),
          phoneLast4: String(payload.answers.phoneLast4),
        };
        delete sanitized.name;
        delete sanitized.age;
        delete sanitized.phoneLast4;
        healthAnswers = sanitized;
        assessmentAnswers = sanitized;
      }

      const assessment = femalePayload ? assessFemaleSurvey(assessmentAnswers) : assessSurvey(assessmentAnswers);
      const id = confirmationId();
      await persistence.save({
        session: {
          clientSubmissionId: payload.clientSubmissionId,
          confirmationId: id,
          questionnaireVersion: payload.questionnaireVersion,
          submittedAt: new Date().toISOString(),
          hasRedFlag: assessment.hasRedFlag,
        },
        identity,
        healthAnswers,
        assessment,
      });
      return { confirmationId: id, assessment };
    },
  };
}
