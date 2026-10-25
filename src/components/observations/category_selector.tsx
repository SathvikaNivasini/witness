import { Check } from "lucide-react";
import { categories } from "@/lib/categories";
import type { Category } from "@/lib/types";

export function CategorySelector({
  value,
  onChange,
  error,
}: {
  value: Category | "";
  onChange: (value: Category) => void;
  error?: string;
}) {
  return (
    <fieldset
      className="category-fieldset"
      aria-describedby={error ? "category-error" : "category-hint"}
    >
      <legend>What did you notice?</legend>
      <p id="category-hint" className="field-hint">
        Choose the one that feels closest. You can describe the rest.
      </p>
      <div className="category-grid">
        {categories.map(({ id, label, hint, icon: Icon }) => (
          <label
            className="category-option"
            data-selected={value === id}
            data-category={id}
            key={id}
          >
            <input
              id={`category-${id}`}
              type="radio"
              name="category"
              value={id}
              checked={value === id}
              onChange={() => onChange(id)}
            />
            <Icon size={25} strokeWidth={1.4} aria-hidden="true" />
            <span>
              <strong>{label}</strong>
              <small>{hint}</small>
            </span>
            <span className="selection-check">
              {value === id && <Check size={14} aria-hidden="true" />}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id="category-error" className="field-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
