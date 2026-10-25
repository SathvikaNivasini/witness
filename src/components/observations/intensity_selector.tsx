import type { Intensity } from "@/lib/types";

const options = [
  { id: "mild", label: "Mild", hint: "Just noticeable" },
  { id: "noticeable", label: "Noticeable", hint: "Easy to notice" },
  { id: "strong", label: "Strong", hint: "Hard to ignore" },
] as const;

export function IntensitySelector({
  value,
  onChange,
}: {
  value: Intensity;
  onChange: (value: Intensity) => void;
}) {
  return (
    <fieldset>
      <legend>How noticeable was it?</legend>
      <p className="field-hint">Your impression, not a measurement of risk.</p>
      <div className="intensity-options">
        {options.map(({ id, label, hint }, index) => (
          <label
            key={id}
            className="intensity-option"
            data-selected={value === id}
          >
            <input
              type="radio"
              name="intensity"
              value={id}
              checked={value === id}
              onChange={() => onChange(id)}
            />
            <span className="intensity-bars" aria-hidden="true">
              {[0, 1, 2].map((bar) => (
                <i key={bar} data-filled={bar <= index} />
              ))}
            </span>
            <strong>{label}</strong>
            <small>{hint}</small>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
