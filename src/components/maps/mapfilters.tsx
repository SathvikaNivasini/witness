import { categories } from "@/lib/categories";
import type { Category } from "@/lib/types";

export function MapFilters({
  value,
  onChange,
}: {
  value: Category | "all";
  onChange: (value: Category | "all") => void;
}) {
  return (
    <div
      className="map-filters"
      role="group"
      aria-label="Filter event categories"
    >
      <button
        type="button"
        aria-pressed={value === "all"}
        onClick={() => onChange("all")}
      >
        All observations
      </button>
      {categories.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
        >
          <Icon size={16} strokeWidth={1.6} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}
