"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocalData } from "@/lib/local-store";
import { demoEvents } from "@/lib/demo-data";
import { matchingInput, requestMatches } from "@/lib/api-client";
import type { MatchingResponse, Observation } from "@/lib/types";
import { MatchCard } from "./matchcard";
import { PageHeading } from "@/components/ui/page-heading";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { DemoBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function PossibleMatches({ id }: { id: string }) {
  const { observations, settings, ready, error } = useLocalData();
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
        title="Your note isn’t in this browser."
        description="Open My Activity in the browser where you saved it."
        action={{ href: "/activity", label: "My Activity" }}
      />
    );
  return (
    <ObservationMatches
      observation={observation}
      showDemo={settings.showDemo}
    />
  );
}

function ObservationMatches({
  observation,
  showDemo,
}: {
  observation: Observation;
  showDemo: boolean;
}) {
  const [attempt, setAttempt] = useState(0);
  const [response, setResponse] = useState<{
    key: string;
    data: MatchingResponse;
  } | null>(null);
  const [failure, setFailure] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const serialized = JSON.stringify(matchingInput(observation));
  const requestKey = `${serialized}:${attempt}`;
  const hasLocation =
    observation.location.latitude !== undefined &&
    observation.location.longitude !== undefined;

  useEffect(() => {
    if (!showDemo || !hasLocation) return;
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 10_000);
    requestMatches(JSON.parse(serialized), controller.signal)
      .then((data) => {
        if (active) setResponse({ key: requestKey, data });
      })
      .catch((error) => {
        if (active)
          setFailure({
            key: requestKey,
            message: controller.signal.aborted
              ? "Matching took a little too long. Your saved note is unchanged. Please try again."
              : error instanceof Error
                ? error.message
                : "Matching is unavailable. Your saved note is unchanged.",
          });
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [serialized, requestKey, showDemo, hasLocation]);

  const data = response?.key === requestKey ? response.data : null;
  const error = failure?.key === requestKey ? failure.message : null;
  const loading = showDemo && hasLocation && !data && !error;
  const matches = (data?.matches ?? []).flatMap((match) => {
    const event = demoEvents.find((item) => item.id === match.eventId);
    return event ? [{ match, event }] : [];
  });

  return (
    <div className="narrow-page">
      <PageHeading
        back={{
          href: `/observations/${observation.id}`,
          label: "Back to your observation",
        }}
        eyebrow="Explore a possible connection"
        title="Could these be related?"
        description="Compare the details, then decide what belongs together in your notebook."
      />
      <div className="comparison-notice">
        <DemoBadge />
        <p>
          <strong>This is a demo comparison.</strong> The events are simulated,
          and the matching model was trained on synthetic pairs. A suggested
          connection is not evidence of a shared source.
        </p>
      </div>
      <p className="field-hint match-method">
        When demo comparisons are enabled, your description, time, and rounded
        area are sent to this app’s matching service for this comparison. Photos
        and your display name stay in this browser. This endpoint does not store
        your note.
      </p>
      {!showDemo ? (
        <EmptyState
          title="Demo examples are hidden."
          description="You can turn demo data on in Profile. Your own observation remains in this browser’s notebook."
        />
      ) : !hasLocation ? (
        <EmptyState
          title="An approximate area is needed to compare."
          description="We can’t calculate distance for this manually entered place. Your note is saved, and it stands on its own."
        />
      ) : loading ? (
        <LoadingState label="Comparing with the matching service…" />
      ) : error ? (
        <div className="error-panel" role="alert">
          <p>{error}</p>
          <Button
            variant="secondary"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Try matching again
          </Button>
        </div>
      ) : matches.length ? (
        <div className="match-list">
          {matches.map(({ match, event }) => (
            <MatchCard
              key={match.eventId}
              match={match}
              event={event}
              observationId={observation.id}
              decision={observation.connections[match.eventId]}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No close demo matches."
          description="The model didn’t find a close enough overlap in the examples’ timing, general area, and category. Your observation is still worth keeping."
        />
      )}
      {data && (
        <p className="small-note matching-service-note">
          Comparison complete · Model {data.algorithmVersion}. {data.dataNote}
        </p>
      )}
      <Link href="/activity" className="button button-secondary">
        Return to My Activity
      </Link>
    </div>
  );
}
