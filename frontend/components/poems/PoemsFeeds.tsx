import { Sparkles } from "lucide-react";
import type { Poem } from "@/types/poem";
import { PoemCard } from "./PoemCard";
import type { PoemActionsViewer } from "./PoemActions";

interface PoemFeedProps {
  poems: Poem[];
  title?: string;
  emptyMessage?: string;
  /** Текущий пользователь (null — гость); передаётся в карточки для меню «⋯» */
  viewer?: PoemActionsViewer | null;
}

export function PoemFeed({
  poems,
  title = "Fresh",
  emptyMessage = "It's empty here for now. Post the first poem!",
  viewer = null,
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
              <PoemCard poem={poem} viewer={viewer} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}