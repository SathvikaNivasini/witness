"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state">
      <h2>Something interrupted the page.</h2>
      <p>
        Your saved browser records haven’t been removed. Try opening the page
        again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
