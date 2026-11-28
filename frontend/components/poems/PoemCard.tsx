import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import type { Poem } from "@/types/poem";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { TagBadge } from "@/components/ui/TagBadge";
import { formatCount, formatRelativeDate } from "@/lib/utils";
import { PoemActions, type PoemActionsViewer } from "@/components/poems/PoemActions";

interface PoemCardProps {
  poem: Poem;
  /** Текущий пользователь — чтобы показать меню «⋯» автору и модераторам */
  viewer?: PoemActionsViewer | null;
}

export function PoemCard({ poem, viewer = null }: PoemCardProps) {
  const { id, title, text, tags, author, stats, publishedAt, readingMinutes } = poem;

  return (
    <GlassCard
      as="article"
      className="relative flex w-full flex-col px-6 pt-6 pb-5 transition-shadow hover:shadow-[0_0.5rem_1.25rem_rgba(90,72,40,0.18)]"
    >
      <div className="flex items-start gap-2">
        <h2 className="min-w-0 flex-1 font-roboto text-2xl font-bold text-ink line-clamp-2">
          {/* after:absolute after:inset-0 — невидимый слой ссылки на всю карточку */}
          <Link
            href={`/poems/${id}`}
            className="focus-ring after:absolute after:inset-0 after:rounded-[1.56rem]"
          >
            {title}
          </Link>
        </h2>
        {/* relative z-20 поднимает меню над слоем ссылки: клик по «⋯» не открывает стих */}
        <div className="relative z-20 -mr-2 -mt-1">
          <PoemActions
            poem={{ id, status: poem.status, hiddenById: poem.hiddenById, authorId: author.id }}
            viewer={viewer}
          />
        </div>
      </div>

      <p className="mt-3 whitespace-pre-line poem-excerpt text-ink-muted line-clamp-4">
        {text}
      </p>

      {tags.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag.slug}>
              <TagBadge tag={tag} />
            </li>
          ))}
        </ul>
      )}

      <hr className="mt-5 border-t border-rule" />

      <footer className="mt-4 flex items-center justify-between gap-3">
        <Link
          href={`/authors/${author.username}`}
          className="group relative z-10 flex min-w-0 items-center gap-3 focus-ring"
        >
          <Avatar name={author.displayName} src={author.avatarUrl} />
          <span className="min-w-0">
            <span className="block truncate text-base text-ink-strong group-hover:underline">
              {author.displayName}
            </span>
            <span className="block text-xs text-ink-muted">
              <time dateTime={publishedAt}>{formatRelativeDate(publishedAt)}</time>
              {" · "}
              {readingMinutes} min
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-3 text-sm text-ink-muted">
          <span className="flex items-center gap-1" aria-label={`Likes: ${stats.likes}`}>
            <Heart className="size-4" aria-hidden />
            {formatCount(stats.likes)}
          </span>
          <span className="flex items-center gap-1" aria-label={`Comments: ${stats.comments}`}>
            <MessageCircle className="size-4" aria-hidden />
            {formatCount(stats.comments)}
          </span>
        </div>
      </footer>
    </GlassCard>
  );
}