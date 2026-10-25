"use client";

import Link from "next/link";
import { ArrowUpRight, GitBranch } from "lucide-react";
import { demoPattern } from "@/lib/demo-data";
import { useLocalData } from "@/lib/local-store";
import { DemoBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export function PatternCard() {
  const { settings } = useLocalData();
  return (
    <section aria-labelledby="pattern-heading" className="pattern-section">
      <div className="section-heading">
        <h2 id="pattern-heading">A possible pattern</h2>
        <GitBranch size={17} strokeWidth={1.4} aria-hidden="true" />
      </div>
      {settings.showDemo ? (
        <Link className="pattern-preview" href={`/patterns/${demoPattern.id}`}>
          <div className="row-meta">
            <span className="eyebrow">Across separate days</span>
            <DemoBadge />
          </div>
          <h3>{demoPattern.title}</h3>
          <p>{demoPattern.summary}</p>
          <div
            className="mini-timeline"
            aria-label="Example events on October 8, 15, and 22"
          >
            <span>
              <i />
              Oct 8
            </span>
            <span>
              <i />
              Oct 15
            </span>
            <span>
              <i />
              Oct 22
            </span>
          </div>
          <div className="pattern-preview-footer">
            <span>{demoPattern.area}</span>
            <span className="text-link">
              Take a closer look
              <ArrowUpRight size={16} aria-hidden="true" />
            </span>
          </div>
        </Link>
      ) : (
        <EmptyState
          title="No recurring patterns identified yet."
          description="Patterns appear when separate events share similar details across dates."
        />
      )}
    </section>
  );
}
