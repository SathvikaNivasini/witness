import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { EventMap } from "@/components/maps/eventmap";

export const metadata: Metadata = { title: "Neighborhood map" };
export default function MapPage() {
  return (
    <>
      <PageHeading
        eyebrow="A little local perspective"
        title="Around you, on the map."
        description="Explore example observations across Dallas. Every marker is a possible conversation, not a confirmed source."
      />
      <EventMap />
    </>
  );
}
