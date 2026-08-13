import { ArrowRight, HeartPulse } from "lucide-react";

export function ModuleIntro({ title, description, tone = "default", onContinue }: {
  title: string;
  description: string;
  tone?: "default" | "safety";
  onContinue(): void;
}) {
  return (
    <section className={`module-intro tone-${tone}`}>
      <div className="module-intro-icon" aria-hidden="true"><HeartPulse /></div>
      <p>{tone === "safety" ? "仅用于人工确认" : "健康状态评估"}</p>
      <h1 tabIndex={-1}>{title}</h1>
      <div className="intro-divider" aria-hidden="true" />
      <p className="module-intro-description">{description}</p>
      <button type="button" className="mobile-primary-button" onClick={onContinue}>继续 <ArrowRight aria-hidden="true" /></button>
    </section>
  );
}
