import { Suspense } from "react";
import { PossibleMatches } from "@/components/events/possible-matches";
import { LoadingState } from "@/components/ui/empty-state";

export const metadata = { title: "Possible demo connections" };
async function Matches({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PossibleMatches id={id} />;
}
export default function MatchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<LoadingState />}>
      <Matches params={params} />
    </Suspense>
  );
}
