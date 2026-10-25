import type { Metadata } from "next";
import { ObservationExperience } from "@/components/observations/observation_form";
import { PageHeading } from "@/components/ui/page-heading";

export const metadata: Metadata = { title: "Record an observation" };

export default function ObservePage() {
  return (
    <div className="narrow-page">
      <PageHeading
        eyebrow="Your field journal"
        title="Record an observation"
        description="Something caught your attention. Let’s make a note of it."
      />
      <ObservationExperience />
    </div>
  );
}
