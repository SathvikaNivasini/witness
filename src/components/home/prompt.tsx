import { Eye, NotebookPen, GitCompareArrows } from "lucide-react";

export function Prompt() {
  return (
    <section className="how-it-works" aria-label="How Witness works">
      <div>
        <Eye size={19} strokeWidth={1.5} aria-hidden="true" />
        <p>
          <strong>Notice something.</strong>
          <span>Your senses are a starting point.</span>
        </p>
      </div>
      <div>
        <NotebookPen size={19} strokeWidth={1.5} aria-hidden="true" />
        <p>
          <strong>Leave a record.</strong>
          <span>A few details, in your own words.</span>
        </p>
      </div>
      <div>
        <GitCompareArrows size={19} strokeWidth={1.5} aria-hidden="true" />
        <p>
          <strong>Look for connections.</strong>
          <span>Possibilities, never proof of a source.</span>
        </p>
      </div>
    </section>
  );
}
