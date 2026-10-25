"use client";

import type { ReactNode } from "react";
import { useLocalData } from "@/lib/local-store";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";

export function DemoGate({ children }: { children: ReactNode }) {
  const { ready, settings } = useLocalData();
  if (!ready) return <LoadingState />;
  if (!settings.showDemo)
    return (
      <EmptyState
        title="Demo examples are tucked away."
        description="You can turn demo data on in Profile to explore this example. Your own observations stay in My Activity."
        action={{ href: "/profile", label: "Open Profile" }}
      />
    );
  return children;
}
