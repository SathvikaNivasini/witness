"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  MapPin,
  Clock3,
  MessageSquare,
} from "lucide-react";
import { updateConnection } from "@/lib/local-store";
import type { DemoEvent, PossibleMatch } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CategoryLabel, DemoBadge } from "@/components/ui/badge";

export function MatchCard({
  match,
  event,
  observationId,
  decision,
}: {
  match: PossibleMatch;
  event: DemoEvent;
  observationId: string;
  decision?: "accepted" | "declined";
}) {
  const [error, setError] = useState("");
  function choose(value: "accepted" | "declined") {
    try {
      updateConnection(observationId, match.eventId, value);
      setError("");
    } catch (issue) {
      setError(
        issue instanceof Error
          ? issue.message
          : "Your choice couldn't be saved. Please try again.",
      );
    }
  }
  return (
    <article className="match-card">
      <div className="row-meta">
        <CategoryLabel category={event.category} />
        <DemoBadge />
      </div>
      <h2>{event.title}</h2>
      <p>{event.area}</p>
      <ul className="match-reasons">
        <li>
          <MapPin size={15} aria-hidden="true" />
          Approximately{" "}
          {match.distanceKm < 1 ? "under 1" : Math.round(match.distanceKm)} km
          between generalized areas
        </li>
        <li>
          <Clock3 size={15} aria-hidden="true" />
          {match.minutesApart < 60
            ? `About ${Math.round(match.minutesApart)} minutes apart`
            : `About ${Math.round(match.minutesApart / 60)} hours apart`}
        </li>
        <li>
          <MessageSquare size={15} aria-hidden="true" />
          {match.componentScores.text === null
            ? "Descriptions couldn’t be compared"
            : match.componentScores.text > 0
              ? "Some wording is shared between the descriptions"
              : "No shared description wording found"}
        </li>
      </ul>
      <p className="small-note">
        {match.componentScores.category === 1
          ? "Same observation category."
          : "Different, related observation categories."}{" "}
        These details come from the matching service.
      </p>
      <Link href={`/events/${match.eventId}`} className="text-link">
        Read the example event
        <ArrowUpRight size={15} aria-hidden="true" />
      </Link>
      <div className="match-actions">
        <Button
          variant={decision === "accepted" ? "secondary" : "primary"}
          onClick={() => choose("accepted")}
          disabled={decision === "accepted"}
        >
          {decision === "accepted" && <Check size={15} aria-hidden="true" />}
          {decision === "accepted"
            ? "Linked in your notebook"
            : "Link this example"}
        </Button>
        <Button
          variant="text"
          onClick={() => choose("declined")}
          disabled={decision === "declined"}
        >
          {decision === "declined" ? "Kept separate" : "Keep separate"}
        </Button>
      </div>
      <p className="match-decision" role="status">
        {decision === "accepted"
          ? "Saved locally. This link doesn’t confirm a shared source."
          : decision === "declined"
            ? "Saved locally. Your observation remains a separate record."
            : ""}
      </p>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}
