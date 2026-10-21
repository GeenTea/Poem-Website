import { Sparkles } from "lucide-react";
import type { Poem } from "@/types/poem";
import { PoemCard } from "./PoemCard";

interface PoemFeedProps {
  poems: Poem[];
  title?: string;
  emptyMessage?: string;
}

export function PoemFeed({
  poems,
  title = "Fresh",
  emptyMessage = "It's empty here for now. Post the first poem!",
}: PoemFeedProps) {
  return (
    <section aria-labelledby="feed-heading">
      <h2 id="feed-heading" className="mb-6 flex items-center gap-2 text-sm text-ink-muted">
        <Sparkles className="size-4 text-leaf-deep" aria-hidden />
        {title}
      </h2>

      {poems.length === 0 ? (
        <p className="py-12 text-center text-ink-muted">{emptyMessage}</p>
      ) : (
        <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
          {poems.map((poem) => (
            <div key={poem.id} className="mb-6 break-inside-avoid">
              <PoemCard poem={poem} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}