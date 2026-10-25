"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteObservation, useLocalData } from "@/lib/local-store";
import { formatDate } from "@/lib/format";
import { demoEvents } from "@/lib/demo-data";
import { PageHeading } from "@/components/ui/page-heading";
import { CategoryLabel } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { EventCard } from "@/components/events/eventcard";
import { SubmissionPanel } from "./submission-panel";

export function ObservationDetail({ id }: { id: string }) {
  const { observations, settings, ready, error } = useLocalData();
  const [deleteError, setDeleteError] = useState("");
  const router = useRouter();
  if (!ready) return <LoadingState />;
  if (error)
    return (
      <div className="error-panel" role="alert">
        {error}
      </div>
    );
  const observation = observations.find((item) => item.id === id);
  if (!observation)
    return (
      <EmptyState
        title="This note isn’t in this browser."
        description="Local observations stay on the browser where they were saved. It may also have been removed."
        action={{ href: "/activity", label: "Back to My Activity" }}
      />
    );
  const related = demoEvents.filter(
    (event) => observation.connections[event.id] === "accepted",
  );
  function remove() {
    if (
      !window.confirm(
        "Remove this observation and its photo from this browser? This cannot be undone. A submitted database copy will not be deleted.",
      )
    )
      return;
    try {
      deleteObservation(id);
      router.push("/activity");
    } catch (issue) {
      setDeleteError(
        issue instanceof Error
          ? issue.message
          : "Your observation couldn't be removed.",
      );
    }
  }
  return (
    <div className="narrow-page">
      <PageHeading
        back={{ href: "/activity", label: "Back to My Activity" }}
        eyebrow="A note from your field journal"
        title="Your observation"
      >
        <div className="detail-meta">
          <CategoryLabel category={observation.category} />
          <span className="local-label">
            {observation.submission?.status === "submitted"
              ? "Submitted"
              : observation.submission
                ? "Submission unconfirmed"
                : "Local only"}
          </span>
        </div>
      </PageHeading>
      <article className="observation-detail">
        <p className="observation-description">{observation.description}</p>
        <dl className="detail-list">
          <div>
            <dt>Noticed</dt>
            <dd>
              {formatDate(observation.occurredAt, true)}
              <small>Dallas time (Central)</small>
            </dd>
          </div>
          <div>
            <dt>General area</dt>
            <dd>{observation.location.label}</dd>
          </div>
          <div>
            <dt>Intensity</dt>
            <dd className="capitalize">
              {observation.intensity}
              <small>Your subjective impression</small>
            </dd>
          </div>
          <div>
            <dt>Saved</dt>
            <dd>{formatDate(observation.savedAt, true)}</dd>
          </div>
        </dl>
        {observation.photo && (
          <Image
            className="observation-photo"
            src={observation.photo}
            alt="Photo saved with your observation"
            width={800}
            height={600}
            unoptimized
          />
        )}
        <p className="privacy-hint">
          <LockKeyhole size={14} aria-hidden="true" />
          Your notebook copy and photo are saved in this browser. Cloud
          submission is optional below.
        </p>
      </article>
      <SubmissionPanel key={observation.id} observation={observation} />
      {settings.showDemo && (
        <section className="observation-connections">
          <h2>Possible connections</h2>
          <p className="field-hint">
            Compare with simulated events to explore how connections work. These
            examples are not evidence about your observation.
          </p>
          {related.map((event) => (
            <EventCard key={event.id} event={event} showDemoLabel />
          ))}
          <Link
            className="button button-secondary"
            href={`/observations/${id}/matches`}
          >
            {related.length
              ? "Review demo connections"
              : "Explore demo comparisons"}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      )}
      {deleteError && (
        <p className="error-panel" role="alert">
          {deleteError}
        </p>
      )}
      <Button variant="danger" className="delete-observation" onClick={remove}>
        <Trash2 size={15} aria-hidden="true" />
        Remove observation
      </Button>
    </div>
  );
}
