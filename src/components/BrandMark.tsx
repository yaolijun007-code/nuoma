import type { SurveyBrandId } from "../brand";

export function BrandMark({ variant = "hospital" }: { variant?: SurveyBrandId }) {
  if (variant === "nuoma-yuanyi") {
    return (
      <div className="brand-mark brand-mark-orbit" aria-hidden="true">
        <span className="orbit-ring" />
        <span className="orbit-core" />
        <span className="orbit-star" />
      </div>
    );
  }
  return (
    <div className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}
