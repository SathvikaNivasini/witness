import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/empty-state";
import { GitBranch, MapPin } from "lucide-react";
import { demoPattern } from "@/lib/demo-data";
import { PatternTimeline } from "@/components/patterns/patterntimeline";
import { PageHeading } from "@/components/ui/page-heading";
import { DemoBadge } from "@/components/ui/badge";
import { DemoGate } from "@/components/layout/demo-gate";

export function generateStaticParams() {
  return [{ id: demoPattern.id }];
}
export const metadata = { title: "A possible recurring pattern" };

async function PatternContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== demoPattern.id) notFound();
  return (
    <DemoGate>
      <div className="detail-page pattern-detail">
        <PageHeading
          back={{ href: "/", label: "Back to Home" }}
          eyebrow="A possible recurring pattern"
          title={demoPattern.title}
          description={demoPattern.summary}
        >
          <div className="detail-meta">
            <DemoBadge />
            <span>
              <MapPin size={14} aria-hidden="true" />
              {demoPattern.area}
            </span>
            <span>October 2026</span>
          </div>
        </PageHeading>
        <div className="detail-columns">
          <section aria-label="Recurring event timeline">
            <PatternTimeline />
          </section>
          <aside className="detail-aside lavender-aside">
            <GitBranch size={22} strokeWidth={1.4} aria-hidden="true" />
            <h2>A thread across the days.</h2>
            <p>
              These separate example events share an odor category, a general
              area, and similar timing. That makes them worth comparing.
            </p>
            <p>
              Recurrence alone doesn’t prove a shared source. Weather, everyday
              activity, and differences in perception can also shape what people
              notice.
            </p>
            <p className="small-note">
              All events in this timeline are simulated. No source has been
              identified.
            </p>
          </aside>
        </div>
      </div>
    </DemoGate>
  );
}

export default function PatternPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<LoadingState label="Opening the pattern…" />}>
      <PatternContent params={params} />
    </Suspense>
  );
}
