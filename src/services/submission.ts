import type { AnswerMap, AssessmentResult } from "../domain/types";

export interface SubmitResult {
  confirmationId: string;
  assessment: AssessmentResult;
}

export async function submitSurvey(
  answers: AnswerMap,
  clientSubmissionId: string,
  honeypot = "",
  questionnaireVersion = "male-health-v1.0",
): Promise<SubmitResult> {
  const endpoint = import.meta.env.VITE_SUBMIT_ENDPOINT;
  if (!endpoint) {
    if (import.meta.env.DEV || import.meta.env.MODE === "test") {
      const { assessSurvey } = await import("../domain/assessment");
      return { confirmationId: `PREVIEW-${Date.now().toString(36).toUpperCase()}`, assessment: assessSurvey(answers) };
    }
    throw new Error("提交服务尚未配置，请联系工作人员");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ questionnaireVersion, clientSubmissionId, honeypot, answers }),
  });
  const data = await response.json().catch(() => ({})) as Partial<SubmitResult> & { error?: string };
  if (!response.ok || !data.confirmationId || !data.assessment) throw new Error(data.error || "提交失败，请稍后重试");
  return data as SubmitResult;
}
