import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { DemoEvent } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { CategoryIcon, CategoryLabel, DemoBadge } from "@/components/ui/badge";

export function EventCard({
  event,
  showDemoLabel = false,
}: {
  event: DemoEvent;
  showDemoLabel?: boolean;
}) {
  return (
    <Link className="event-row" href={`/events/${event.id}`}>
      <CategoryIcon category={event.category} />
      <div className="event-row-content">
        <div className="row-meta">
          <CategoryLabel category={event.category} />
          {showDemoLabel && <DemoBadge />}
        </div>
        <h3>{event.title}</h3>
        <p>
          {event.area}
          <span aria-hidden="true"> · </span>
          <time dateTime={event.occurredAt}>
            {formatDate(event.occurredAt)}
          </time>
        </p>
      </div>
      <ChevronRight
        className="row-arrow"
        size={17}
        strokeWidth={1.5}
        aria-hidden="true"
      />
    </Link>
  );
}
