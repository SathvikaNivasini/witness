import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { demoPattern } from "@/lib/demo-data";
import { formatDate } from "@/lib/format";

export function PatternTimeline() {
  return (
    <ol className="pattern-timeline">
      {demoPattern.entries.map((entry, index) => (
        <li key={entry.date}>
          <span className="timeline-point">
            {String(index + 1).padStart(2, "0")}
          </span>
          <time dateTime={entry.date}>{formatDate(entry.date)}</time>
          <details className="pattern-entry" open={index === 0}>
            <summary>
              <span>{entry.title}</span>
              <ChevronDown size={18} strokeWidth={1.5} aria-hidden="true" />
            </summary>
            <div className="pattern-entry-body">
              <p>{entry.description}</p>
              <div className="connection-reason">
                <span>Why it may connect</span>
                <p>{entry.reason}</p>
              </div>
              {entry.eventId && (
                <Link href={`/events/${entry.eventId}`} className="text-link">
                  Explore this example event
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              )}
            </div>
          </details>
        </li>
      ))}
    </ol>
  );
}
