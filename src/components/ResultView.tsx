import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, Sparkles } from "lucide-react";
import type { AssessmentLevel, AssessmentResult } from "../domain/types";

const levelCopy: Record<AssessmentLevel, string> = {
  stable: "基本稳定",
  signal: "存在变化信号",
  evaluate: "建议进一步评估",
  clinical_priority: "优先临床评估",
};

export function ResultView({ result, confirmationId }: { result: AssessmentResult; confirmationId: string }) {
  return (
    <main className="result-shell">
      <section className={`result-hero ${result.hasRedFlag ? "is-priority" : ""}`}>
        <div className="result-icon" aria-hidden="true">
          {result.hasRedFlag ? <AlertTriangle /> : <ClipboardCheck />}
        </div>
        <p className="eyebrow">评估已完成</p>
        <h1>{result.hasRedFlag ? "请先完成医务人员核实" : "您的功能状态画像"}</h1>
        <p>{result.hasRedFlag
          ? "医学安全信息中存在需要优先了解的内容。请勿仅依据本页面自行判断或处理。"
          : "以下内容用于帮助确定进一步了解和管理的优先方向，不代表疾病诊断。"}</p>
        <div className="confirmation">确认编号 <strong>{confirmationId}</strong></div>
      </section>

      <section className="result-grid" aria-label="八维功能状态">
        {result.domains.map((domain) => (
          <article className={`result-card level-${domain.level}`} key={domain.id}>
            <div className="result-card-head">
              {domain.level === "stable" ? <CheckCircle2 aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
              <span>{levelCopy[domain.level]}</span>
            </div>
            <h2>{domain.title}</h2>
            <p>{domain.recommendation}</p>
            {domain.reasons.length > 0 && <div className="reason"><ArrowRight aria-hidden="true" />{domain.reasons[0]}</div>}
          </article>
        ))}
      </section>

      <aside className="clinical-note">
        <strong>重要说明</strong>
        <p>本问卷不是疾病诊断工具，也不独立判断生物年龄。正式评估需结合体检、实验室检测、既往资料与专项检查。</p>
      </aside>
    </main>
  );
}

