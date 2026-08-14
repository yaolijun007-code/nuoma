import { Activity, ArrowRight, ClipboardCheck, Flower2, HeartPulse, Leaf, MoonStar, ShieldCheck, Sparkles, Target, UserRound } from "lucide-react";

const icons = { activity: Activity, clipboard: ClipboardCheck, flower: Flower2, heart: HeartPulse, leaf: Leaf, moon: MoonStar, shield: ShieldCheck, sparkles: Sparkles, target: Target, user: UserRound };

export function ModuleIntro({ title, description, tone = "default", icon = "heart", onContinue }: {
  title: string;
  description: string;
  tone?: "default" | "safety";
  icon?: string;
  onContinue(): void;
}) {
  const Icon = icons[icon as keyof typeof icons] ?? HeartPulse;
  return (
    <section className={`module-intro tone-${tone}`}>
      <div className="module-intro-icon" aria-hidden="true"><Icon /></div>
      <p>{tone === "safety" ? "仅用于人工确认" : "健康状态评估"}</p>
      <h1 tabIndex={-1}>{title}</h1>
      <div className="intro-divider" aria-hidden="true" />
      <p className="module-intro-description">{description}</p>
      <button type="button" className="mobile-primary-button" onClick={onContinue}>继续 <ArrowRight aria-hidden="true" /></button>
    </section>
  );
}
