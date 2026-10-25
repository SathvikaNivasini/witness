import type { DemoEvent } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function EventTimeline({ reports }: { reports: DemoEvent["reports"] }) {
  return (
    <ol className="event-timeline">
      {reports.map((report, index) => (
        <li key={report.time}>
          <span className="timeline-point" />
          <div className="timeline-meta">
            <time dateTime={report.time}>{formatDate(report.time, true)}</time>
            <span>Example note {String(index + 1).padStart(2, "0")}</span>
          </div>
          <p>{report.description}</p>
          <span className="intensity-note">
            Subjective intensity:{" "}
            <span className="capitalize">{report.intensity}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
