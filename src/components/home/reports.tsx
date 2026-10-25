"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { demoEvents } from "@/lib/demo-data";
import { useLocalData } from "@/lib/local-store";
import { EventCard } from "@/components/events/eventcard";
import { DemoBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export function Reports() {
  const { settings } = useLocalData();
  const recent = [...demoEvents]
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, 3);
  return (
    <section aria-labelledby="nearby-heading" className="nearby-section">
      <div className="section-heading">
        <h2 id="nearby-heading">Around the neighborhood</h2>
        <Link href="/map" className="text-link">
          Explore map
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </div>
      {settings.showDemo ? (
        <>
          <div className="section-note">
            <DemoBadge />
            <span>
              Illustrative Dallas reports. These aren’t live observations.
            </span>
          </div>
          <div className="event-list">
            {recent.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="No nearby reports to show right now."
          description="You can still save your own observation. Community reports will appear when a live service is connected."
          action={{ href: "/observe", label: "Make a note" }}
        />
      )}
    </section>
  );
}
