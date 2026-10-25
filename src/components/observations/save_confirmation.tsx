import Link from "next/link";
import { Check, LockKeyhole, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryLabel } from "@/components/ui/badge";
import type { Observation } from "@/lib/types";

export function SaveConfirmation({
  observation,
  showDemo,
  onNew,
}: {
  observation: Observation;
  showDemo: boolean;
  onNew: () => void;
}) {
  return (
    <div className="save-confirmation" id="save-confirmation" tabIndex={-1}>
      <span className="success-check">
        <Check size={29} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <p className="eyebrow">A note worth keeping</p>
      <h2>Observation saved.</h2>
      <p>You can find it anytime in My Activity.</p>
      <div className="saved-summary">
        <CategoryLabel category={observation.category} />
        <p>{observation.description}</p>
        <span>{observation.location.label}</span>
      </div>
      <p className="privacy-hint">
        <LockKeyhole size={14} aria-hidden="true" />
        Saved on this browser only. Opening comparisons sends the note’s text,
        time, and rounded area to the matching service. Your photo stays here.
      </p>
      <div className="confirmation-actions">
        <Link
          href={`/observations/${observation.id}`}
          className="button button-secondary"
        >
          View note & submission options
        </Link>
        <Link
          href={`/observations/${observation.id}${showDemo ? "/matches" : ""}`}
          className="button button-primary"
        >
          {showDemo ? "Explore possible demo matches" : "View observation"}
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
        <Link href="/activity" className="button button-secondary">
          My Activity
        </Link>
      </div>
      <Button variant="text" onClick={onNew}>
        Record another observation
      </Button>
    </div>
  );
}
