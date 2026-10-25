import Image from "next/image";
import { LockKeyhole } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryLabel } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { ObservationDraft } from "@/lib/types";

export function ObservationReview({
  draft,
  onEdit,
}: {
  draft: ObservationDraft;
  onEdit: () => void;
}) {
  return (
    <>
      <Card className="review-card">
        {draft.category && <CategoryLabel category={draft.category} />}
        <blockquote>{draft.description}</blockquote>
        <dl className="detail-list">
          <div>
            <dt>Intensity</dt>
            <dd className="capitalize">{draft.intensity}</dd>
          </div>
          <div>
            <dt>Noticed</dt>
            <dd>
              {Number.isFinite(Date.parse(draft.occurredAt))
                ? formatDate(draft.occurredAt, true)
                : "Time needed"}
              <small>Dallas time (Central)</small>
            </dd>
          </div>
          <div>
            <dt>General area</dt>
            <dd>{draft.location.label}</dd>
          </div>
        </dl>
        {draft.photo && (
          <Image
            className="review-photo"
            src={draft.photo}
            alt="Photo attached to your observation"
            width={640}
            height={400}
            unoptimized
          />
        )}
        <Button variant="text" onClick={() => onEdit()}>
          Edit details
        </Button>
      </Card>
      <div className="local-storage-note">
        <LockKeyhole size={18} strokeWidth={1.5} aria-hidden="true" />
        <p>
          <strong>Your notebook, on this browser.</strong>This app saves locally
          and won’t sync across devices. Opening demo comparisons sends only
          your description, time, and rounded area to the matching service.
          Photos stay here. Clearing browser data removes your notebook.
        </p>
      </div>
    </>
  );
}
