import type { ReactNode } from "react";
import { SurveyHeader } from "./SurveyHeader";

export function SurveyShell({ children, pageId, moduleId, moduleTitle, progress, tone, onBack }: {
  children: ReactNode;
  pageId: string;
  moduleId: string;
  moduleTitle: string;
  progress: number;
  tone?: "default" | "safety";
  onBack(): void;
}) {
  return (
    <div className="hospital-survey survey-active">
      <SurveyHeader moduleId={moduleId} moduleTitle={moduleTitle} progress={progress} tone={tone} onBack={onBack} />
      <main className="mobile-survey-main"><div className="page-enter" key={pageId}>{children}</div></main>
    </div>
  );
}
