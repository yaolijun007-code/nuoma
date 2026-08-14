import { ChevronLeft } from "lucide-react";
import { hospitalModules } from "../surveyDefinition";

export function SurveyHeader({ moduleId, moduleTitle, progress, onBack, tone = "default", modules = hospitalModules }: {
  moduleId: string;
  moduleTitle: string;
  progress: number;
  onBack(): void;
  tone?: "default" | "safety";
  modules?: { id: string }[];
}) {
  const moduleIndex = Math.max(0, modules.findIndex((module) => module.id === moduleId));
  return (
    <header className={`mobile-survey-header tone-${tone}`}>
      <div className="header-row">
        <button type="button" className="back-button" aria-label="返回上一题" onClick={onBack}><ChevronLeft aria-hidden="true" /></button>
        <span className="module-name">{moduleTitle}</span>
        <span className="progress-percent">{Math.round(progress)}%</span>
      </div>
      <div className="progress-bar" role="progressbar" aria-label={`问卷进度 ${Math.round(progress)}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="module-segments" aria-hidden="true">
        {modules.map((module, index) => <span className={index < moduleIndex ? "done" : index === moduleIndex ? "current" : ""} key={module.id} />)}
      </div>
    </header>
  );
}
