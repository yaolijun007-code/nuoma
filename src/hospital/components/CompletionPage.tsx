import { ArrowDown, ArrowRight, Check, ClipboardCheck } from "lucide-react";

export function CompletionPage({ hasRedFlag, confirmationId, variant = "male" }: { hasRedFlag: boolean; confirmationId: string; variant?: "male" | "female" }) {
  const collected = variant === "female"
    ? ["女性生命周期", "睡眠与身心状态", "代谢与身体功能", "女性专项信息", "胃肠与生活方式"]
    : ["基础健康信息", "身体功能状态", "胃肠与生活方式", "男性健康信息", "医学安全信息"];
  return (
    <main className="hospital-completion">
      <div className="completion-mark" aria-hidden="true"><ClipboardCheck /></div>
      <p className="completion-eyebrow">ASSESSMENT COMPLETE</p>
      <h1>健康信息采集完成</h1>
      <p className="completion-lead">感谢您的认真填写，相关信息已安全记录。</p>

      <ul className="completion-list">
        {collected.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}
      </ul>

      {hasRedFlag && <div className="completion-safety-note">有部分健康信息建议由医务人员进一步确认。</div>}

      <section className="next-flow" id="next-steps" aria-label="后续流程">
        <div className="flow-step current"><span>01</span><div><strong>健康问卷</strong><small><Check aria-hidden="true" /> 已完成</small></div></div>
        <ArrowDown className="flow-arrow" aria-hidden="true" />
        <div className="flow-step"><span>02</span><strong>{variant === "female" ? "医务人员评估" : "微生态检测"}</strong></div>
        <ArrowDown className="flow-arrow" aria-hidden="true" />
        <div className="flow-step"><span>03</span><strong>综合健康报告</strong></div>
      </section>

      <p className="completion-disclaimer">本次信息将与当前体检、既往健康资料及必要的专项检测综合分析，不依据问卷单独判断疾病或生物年龄。</p>
      <button type="button" className="mobile-primary-button" onClick={() => document.getElementById("next-steps")?.scrollIntoView({ behavior: "smooth" })}>查看下一步 <ArrowRight aria-hidden="true" /></button>
      <p className="confirmation-code">记录编号 {confirmationId}</p>
    </main>
  );
}
