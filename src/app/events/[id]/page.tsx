import Link from "next/link";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/empty-state";
import { notFound } from "next/navigation";
import { ArrowUpRight, MapPin, Info } from "lucide-react";
import { demoEvents, demoPattern } from "@/lib/demo-data";
import { formatDate } from "@/lib/format";
import { PageHeading } from "@/components/ui/page-heading";
import { CategoryLabel, DemoBadge } from "@/components/ui/badge";
import { EventTimeline } from "@/components/events/event-timeline";
import { DemoGate } from "@/components/layout/demo-gate";

export function generateStaticParams() {
  return demoEvents.map(({ id }) => ({ id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return {
    title:
      demoEvents.find((event) => event.id === id)?.title ?? "Event not found",
  };
}

async function EventContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = demoEvents.find((event) => event.id === id);
  if (!event) notFound();
  return (
    <DemoGate>
      <div className="detail-page">
        <PageHeading
          back={{ href: "/map", label: "Back to the map" }}
          eyebrow="A possible local event"
          title={event.title}
        >
          <div className="detail-meta">
            <CategoryLabel category={event.category} />
            <DemoBadge />
            <span>
              <MapPin size={14} aria-hidden="true" />
              {event.area}
            </span>
          </div>
        </PageHeading>
        <div className="detail-columns">
          <section>
            <p className="lead-paragraph">{event.description}</p>
            <div className="section-heading">
              <h2>The observation timeline</h2>
            </div>
            <p className="field-hint">
              {event.reports.length} simulated{" "}
              {event.reports.length === 1 ? "note" : "notes"} ·{" "}
              {formatDate(event.occurredAt)} · Central time
            </p>
            <EventTimeline reports={event.reports} />
          </section>
          <aside className="detail-aside">
            <Info size={21} strokeWidth={1.4} aria-hidden="true" />
            <h2>A connection, with context.</h2>
            <p>
              These example notes are grouped by category, overlapping time, and
              a generalized area. Similar descriptions can add context.
            </p>
            <p>
              Grouping does not verify a cause, identify a source, or measure
              environmental risk. Every note on this page is simulated.
            </p>
            {event.id === "trinity-odor" && (
              <Link href={`/patterns/${demoPattern.id}`} className="text-link">
                See the recurring example
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            )}
          </aside>
        </div>
      </div>
    </DemoGate>
  );
}

export default function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<LoadingState label="Opening the event…" />}>
      <EventContent params={params} />
    </Suspense>
  );
}
