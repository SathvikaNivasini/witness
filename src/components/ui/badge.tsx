import { getCategory } from "@/lib/categories";
import type { Category } from "@/lib/types";

export function DemoBadge() {
  return <span className="demo-badge">Demo data</span>;
}

export function CategoryIcon({
  category,
  size = 20,
}: {
  category: Category;
  size?: number;
}) {
  const Icon = getCategory(category).icon;
  return (
    <span className="category-icon" data-category={category}>
      <Icon size={size} strokeWidth={1.6} aria-hidden="true" />
    </span>
  );
}

export function CategoryLabel({ category }: { category: Category }) {
  return (
    <span className="category-label" data-category={category}>
      <span className="category-dot" />
      {getCategory(category).label}
    </span>
  );
}
