import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      title="A little off the trail."
      description="We couldn’t find that page. Your notebook is a good place to pick things up."
      action={{ href: "/", label: "Back to Home" }}
    />
  );
}
