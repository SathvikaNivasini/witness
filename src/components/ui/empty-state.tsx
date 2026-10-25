import Link from "next/link";
import { Sprout } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="empty-state">
      <Sprout size={32} strokeWidth={1.2} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
      {action && (
        <Link className="button button-secondary" href={action.href}>
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function LoadingState({
  label = "Opening your notebook…",
}: {
  label?: string;
}) {
  return (
    <p className="loading-state" role="status">
      <span className="loading-dot" />
      {label}
    </p>
  );
}
