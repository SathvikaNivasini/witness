import Link from "next/link";
import { ChevronRight, GitBranch } from "lucide-react";
import type { Observation } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { CategoryIcon, CategoryLabel } from "@/components/ui/badge";

export function ObservationCard({ observation }: { observation: Observation }) {
  const linked = Object.values(observation.connections).some(
    (decision) => decision === "accepted",
  );
  return (
    <Link href={`/observations/${observation.id}`} className="observation-row">
      <CategoryIcon category={observation.category} />
      <div className="observation-row-content">
        <div className="row-meta">
          <CategoryLabel category={observation.category} />
          <span className="local-label">
            {observation.submission?.status === "submitted"
              ? "Submitted"
              : observation.submission
                ? "Submission unconfirmed"
                : "Local only"}
          </span>
        </div>
        <h2>{observation.description}</h2>
        <p>
          {observation.location.label}
          <span aria-hidden="true"> · </span>
          <time dateTime={observation.occurredAt}>
            {formatDate(observation.occurredAt, true)}
          </time>
        </p>
        {linked && (
          <span className="linked-note">
            <GitBranch size={13} aria-hidden="true" />
            Linked to a demo event
          </span>
        )}
      </div>
      <ChevronRight size={17} aria-hidden="true" />
    </Link>
  );
}
