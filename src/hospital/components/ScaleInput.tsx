import { Check } from "lucide-react";

export function ScaleInput({ value, onChange }: { value: unknown; onChange(value: number): void }) {
  return (
    <fieldset className="health-scale">
      <legend className="sr-only">整体健康状态评分</legend>
      <div className="scale-rail" aria-hidden="true" />
      <div className="scale-options">
        {Array.from({ length: 11 }, (_, score) => (
          <label className={Number(value) === score ? "selected" : ""} key={score}>
            <input type="radio" name="health-scale" value={score} checked={Number(value) === score} onChange={() => onChange(score)} aria-label={`${score}分`} />
            <span>{score}</span>
            <Check aria-hidden="true" />
          </label>
        ))}
      </div>
      <div className="scale-labels"><span>非常差</span><span>非常好</span></div>
    </fieldset>
  );
}
