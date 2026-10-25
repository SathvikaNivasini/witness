"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ArrowUpRight } from "lucide-react";
import { useLocalData } from "@/lib/local-store";
import { demoEvents } from "@/lib/demo-data";
import { ObservationCard } from "./observation_card";
import { EventCard } from "@/components/events/eventcard";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";

export function Activity() {
  const { observations, draft, settings, ready, error } = useLocalData();
  const [filter, setFilter] = useState("all");
  const connections = new Set(
    observations.flatMap((observation) =>
      Object.entries(observation.connections)
        .filter(([, decision]) => decision === "accepted")
        .map(([id]) => id),
    ),
  );
  const related = demoEvents.filter((event) => connections.has(event.id));
  const visible =
    filter === "connected"
      ? observations.filter((observation) =>
          Object.values(observation.connections).includes("accepted"),
        )
      : observations;
  return (
    <>
      <div className="heading-with-action">
        <PageHeading
          eyebrow="Your personal field journal"
          title="My Activity"
          description="The things you noticed, kept in one place."
        />
        <Link href="/observe" className="button button-primary">
          <Plus size={17} aria-hidden="true" />
          Record observation
        </Link>
      </div>
      {!ready ? (
        <LoadingState />
      ) : error ? (
        <div className="error-panel" role="alert">
          {error}
          <p>
            <Link href="/profile#privacy" className="text-link">
              Open storage settings
            </Link>
          </p>
        </div>
      ) : (
        <>
          {draft && (
            <div className="draft-banner">
              <div>
                <strong>A note is waiting for you.</strong>
                <p>Your saved draft is ready whenever you are.</p>
              </div>
              <Link href="/observe" className="text-link">
                Continue draft
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
          )}
          <div className="activity-layout">
            <section>
              <div
                className="activity-tabs"
                role="group"
                aria-label="Filter your observations"
              >
                <button
                  type="button"
                  aria-pressed={filter === "all"}
                  onClick={() => setFilter("all")}
                >
                  All observations<span>{observations.length}</span>
                </button>
                <button
                  type="button"
                  aria-pressed={filter === "connected"}
                  onClick={() => setFilter("connected")}
                >
                  With connections
                </button>
              </div>
              {visible.length ? (
                <div className="observation-list">
                  {visible.map((observation) => (
                    <ObservationCard
                      key={observation.id}
                      observation={observation}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={
                    observations.length
                      ? "No connections yet."
                      : "No observations yet."
                  }
                  description={
                    observations.length
                      ? "Open an observation to compare it with possible demo events. Your own record stands on its own."
                      : "Your first record starts here. A few words about what you noticed are enough."
                  }
                  action={
                    observations.length
                      ? undefined
                      : {
                          href: "/observe",
                          label: "Record your first observation",
                        }
                  }
                />
              )}
            </section>
            <aside className="activity-aside">
              <h2>Related events</h2>
              {settings.showDemo && related.length ? (
                <>
                  <p className="field-hint">
                    Demo events you’ve linked in this notebook.
                  </p>
                  {related.map((event) => (
                    <EventCard key={event.id} event={event} showDemoLabel />
                  ))}
                </>
              ) : (
                <div className="quiet-note">
                  <p>
                    {!settings.showDemo && related.length
                      ? "Demo connections are hidden."
                      : "Connections can start with a single note."}
                  </p>
                  <span>
                    {!settings.showDemo && related.length
                      ? "Turn on demo examples in Profile to see linked events."
                      : "When you link an observation to an example event, you’ll find it here."}
                  </span>
                </div>
              )}
              <p className="small-note">
                Saved in this browser. Export a copy from Profile if you’d like
                to keep a backup.
              </p>
            </aside>
          </div>
        </>
      )}
    </>
  );
}
