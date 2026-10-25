"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, ChevronUp, MapPin, X } from "lucide-react";
import { MapFilters } from "./mapfilters";
import { categories, getCategory } from "@/lib/categories";
import { demoEvents } from "@/lib/demo-data";
import { useLocalData } from "@/lib/local-store";
import { formatDate } from "@/lib/format";
import { CategoryIcon, CategoryLabel, DemoBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { Category } from "@/lib/types";

export function DallasMapDrawing() {
  return (
    <svg
      viewBox="0 0 1000 650"
      preserveAspectRatio="none"
      className="map-drawing"
      aria-hidden="true"
    >
      <rect width="1000" height="650" fill="#ECEDE4" />
      <g fill="#DFE6D7">
        <path d="m80 30 280 25-33 144-265-19Z" />
        <path d="m693 44 245-13 28 174-223 62-74-95Z" />
        <path d="m43 419 201-44 136 228-349 22Z" />
        <path d="m649 410 317-65 18 247-268 44Z" />
      </g>
      <g fill="#E4E3D9" stroke="#D9DAD0" strokeWidth="1">
        <path d="m428 42 160-3 20 104-167 38Z" />
        <path d="m452 252 153-20 34 92-172 47Z" />
        <path d="m677 285 189-50 39 60-199 63Z" />
        <path d="m92 236 204 14-20 97-197 19Z" />
        <path d="m464 433 152-47 31 132-128 42Z" />
      </g>
      <path
        d="M380-30c106 82-53 115-24 197s149 70 108 146-149 75-133 152 177 81 163 213"
        stroke="#D1DCCB"
        strokeWidth="83"
        fill="none"
      />
      <path
        d="M380-30c106 82-53 115-24 197s149 70 108 146-149 75-133 152 177 81 163 213"
        stroke="#A9C2CF"
        strokeWidth="18"
        fill="none"
      />
      <path
        d="M380-30c106 82-53 115-24 197s149 70 108 146-149 75-133 152 177 81 163 213"
        stroke="#85A5B2"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M820 70c-35-17-59 20-50 52s40 62 27 93 40 37 62 5 38-72 14-103-23-30-53-47Z"
        fill="#A9C2CF"
      />
      <g stroke="#FCFBF8" strokeWidth="9" fill="none">
        <path d="M-20 212 209 226 490 198 1010 338M51-20 84 237 158 407 220 680M634-20 627 182 674 379 687 680M-20 429l256-54 291-62 483-102M239-20l-5 188 71 184 155 328M-20 562l311-46 264-25 465 54M-20 87l251 21 353-36 426 9M926-20 895 281 841 680" />
      </g>
      <g stroke="#D4D5CA" strokeWidth="1" fill="none">
        <path d="M-20 212 209 226 490 198 1010 338M51-20 84 237 158 407 220 680M634-20 627 182 674 379 687 680M-20 429l256-54 291-62 483-102M239-20l-5 188 71 184 155 328M-20 562l311-46 264-25 465 54M-20 87l251 21 353-36 426 9M926-20 895 281 841 680" />
      </g>
      <g fill="#6D7B6A" fontFamily="sans-serif" fontSize="13" letterSpacing="2">
        <text x="100" y="168">
          WEST DALLAS
        </text>
        <text x="515" y="274">
          DALLAS
        </text>
        <text x="694" y="172">
          WHITE ROCK
        </text>
        <text x="692" y="406">
          EAST DALLAS
        </text>
        <text x="545" y="585">
          SOUTH DALLAS
        </text>
      </g>
      <text
        x="399"
        y="478"
        fill="#65868C"
        fontSize="12"
        fontFamily="sans-serif"
        transform="rotate(35 399 478)"
      >
        Trinity River
      </text>
    </svg>
  );
}

export function EventMap() {
  const { settings } = useLocalData();
  const [filter, setFilter] = useState<Category | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const lastMarker = useRef<HTMLButtonElement | null>(null);
  const events = settings.showDemo
    ? demoEvents.filter(
        (event) => filter === "all" || event.category === filter,
      )
    : [];
  const selected = events.find((event) => event.id === selectedId);

  function close() {
    setSelectedId(null);
    setExpanded(false);
    lastMarker.current?.focus();
  }

  return (
    <>
      <MapFilters
        value={filter}
        onChange={(category) => {
          setFilter(category);
          setSelectedId(null);
          setExpanded(false);
        }}
      />
      <div className="map-layout">
        <div
          className="map-canvas"
          role="region"
          aria-label="Illustrative Dallas event map"
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
        >
          <DallasMapDrawing />
          <span className="map-area-label">
            <MapPin size={13} aria-hidden="true" />
            Dallas, TX <span>Illustrative map</span>
          </span>
          <span className="map-north" aria-hidden="true">
            N ↑
          </span>
          {events.map((event) => {
            const Icon = getCategory(event.category).icon;
            return (
              <button
                key={event.id}
                type="button"
                className="map-marker"
                data-category={event.category}
                data-selected={selected?.id === event.id}
                style={{
                  left: `${event.position.x}%`,
                  top: `${event.position.y}%`,
                }}
                aria-label={`${getCategory(event.category).label}: ${event.title}, ${event.area}`}
                aria-expanded={selected?.id === event.id}
                aria-controls={
                  selected?.id === event.id ? "map-event-preview" : undefined
                }
                onClick={(click) => {
                  lastMarker.current = click.currentTarget;
                  setSelectedId(event.id);
                  setExpanded(false);
                }}
              >
                <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
              </button>
            );
          })}
          <span className="map-watermark">SCHEMATIC · NOT TO SCALE</span>
          {selected && (
            <aside
              className="map-sheet"
              id="map-event-preview"
              key={selected.id}
              aria-label="Selected demo event"
            >
              <div className="map-sheet-header">
                <CategoryLabel category={selected.category} />
                <DemoBadge />
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Close event preview"
                  onClick={close}
                >
                  <X size={17} aria-hidden="true" />
                </button>
              </div>
              <h2>{selected.title}</h2>
              <p className="map-sheet-area">
                {selected.area} · {formatDate(selected.occurredAt)}
              </p>
              <button
                type="button"
                className="sheet-toggle"
                aria-expanded={expanded}
                aria-controls="map-event-description"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Less detail" : "A little more detail"}
                {expanded ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
              </button>
              <div className="expandable-grid" data-expanded={expanded}>
                <div id="map-event-description" inert={!expanded}>
                  <p>{selected.description}</p>
                  <p>
                    Areas are generalized. These example reports are unverified.
                  </p>
                </div>
              </div>
              <Link href={`/events/${selected.id}`} className="text-link">
                View event & timeline
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </aside>
          )}
        </div>
        <aside className="map-sidebar">
          <div className="section-heading">
            <h2>In this view</h2>
            {settings.showDemo && <DemoBadge />}
          </div>
          <p className="field-hint">Select an area to look a little closer.</p>
          {events.length ? (
            <div className="map-event-list">
              {events.map((event) => (
                <button
                  type="button"
                  key={event.id}
                  aria-pressed={selected?.id === event.id}
                  onClick={() => {
                    setSelectedId(event.id);
                    setExpanded(false);
                  }}
                >
                  <CategoryIcon category={event.category} size={18} />
                  <span>
                    <strong>{event.title}</strong>
                    <small>{event.area}</small>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="A quiet map for now."
              description={
                settings.showDemo
                  ? "No example events in this category."
                  : "Demo data is hidden. There’s no live report service connected yet."
              }
            />
          )}
          <div className="map-explanation">
            <h3>A place to explore, carefully.</h3>
            <p>
              Markers represent general areas with example observations. They
              don’t show pollution levels, private locations, or confirmed
              sources.
            </p>
          </div>
        </aside>
      </div>
      <div className="map-legend" aria-label="Map legend">
        {categories.map(({ id, label }) => (
          <span key={id}>
            <i className="category-dot" data-category={id} />
            {label}
          </span>
        ))}
        <span className="legend-note">Approximate areas · Demo data only</span>
      </div>
      <p className="sr-only" role="status">
        {events.length} illustrative events shown.
        {selected ? ` Selected: ${selected.title}.` : ""}
      </p>
    </>
  );
}
