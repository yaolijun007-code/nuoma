import { assessSurvey } from "./assessment";
import { maleHealthV1 } from "./questionnaire";
import type { AnswerMap, AssessmentResult } from "./types";
import { validateStep } from "./validation";

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
  identity: { name: string; age: number; phoneLast4: string };
  healthAnswers: AnswerMap;
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

const allowedAnswerIds = new Set(maleHealthV1.sections.flatMap((section) => section.questions.map((question) => question.id)));

function parsePayload(input: unknown): SubmissionPayload {
  if (!input || typeof input !== "object") throw new SubmissionError("INVALID_PAYLOAD", "提交内容格式不正确");
  const payload = input as Partial<SubmissionPayload>;
  if (payload.honeypot) throw new SubmissionError("BOT_REJECTED", "请求已拒绝");
  if (payload.questionnaireVersion !== maleHealthV1.version) throw new SubmissionError("INVALID_PAYLOAD", "问卷版本不受支持");
  if (!payload.clientSubmissionId || !/^[a-zA-Z0-9-]{16,64}$/.test(payload.clientSubmissionId)) {
    throw new SubmissionError("INVALID_PAYLOAD", "提交标识无效");
  }
  if (!payload.answers || typeof payload.answers !== "object" || Array.isArray(payload.answers)) {
    throw new SubmissionError("INVALID_PAYLOAD", "问卷答案格式不正确");
  }
  const errors = maleHealthV1.sections.flatMap((section) => Object.values(validateStep(section.id, payload.answers!)));
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

      const sanitized = Object.fromEntries(
        Object.entries(payload.answers).filter(([id]) => allowedAnswerIds.has(id)),
      ) as AnswerMap;
      const identity = {
        name: String(payload.answers.name).trim().slice(0, 80),
        age: Number(payload.answers.age),
        phoneLast4: String(payload.answers.phoneLast4),
      };
      delete sanitized.name;
      delete sanitized.age;
      delete sanitized.phoneLast4;

      const assessment = assessSurvey(sanitized);
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
        healthAnswers: sanitized,
        assessment,
      });
      return { confirmationId: id, assessment };
    },
  };
}

