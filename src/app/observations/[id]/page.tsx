import { Suspense } from "react";
import { ObservationDetail } from "@/components/observations/observation-detail";
import { LoadingState } from "@/components/ui/empty-state";

export const metadata = { title: "Your observation" };
async function Record({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ObservationDetail id={id} />;
}
export default function ObservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<LoadingState />}>
      <Record params={params} />
    </Suspense>
  );
}
