import Link from "next/link";
import { notFound } from "next/navigation";
import { getIsLiked, getPoemForViewer } from "@/lib/poems";
import { LikeButton } from "@/components/poems/LikeButton";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@/types/user";
import type { Poem } from "@/types/poem";
import { ApiError } from "@/lib/poem-api";
import { TagBadge } from "@/components/ui/TagBadge";
import { Avatar } from "@/components/ui/Avatar";
import { CommentSection } from "@/components/poems/CommentSection";
import { ShareButton } from "@/components/poems/ShareButton";
import { ReportPoemButton } from "@/components/poems/ReportPoemButton";
import { PoemActions } from "@/components/poems/PoemActions";
import { formatCount, formatRelativeDate } from "@/lib/utils";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";

// Поля, которых может не быть в типе Poem. Если они есть в types/user.ts — этот тип можно убрать.
type AuthorExtras = {
  bio?: string | null;
  followersCount?: number;
};

type MorePoem = {
  id: string;
  title: string;
  likes: number;
  label?: string; // жанр или первый тег
};

const card =
  "auth-card rounded-[28px] bg-[var(--glass)]";

export async function generateMetadata(props: PageProps<"/poems/[id]">): Promise<Metadata> {
  const { id } = await props.params;

  try {
    const poem = await getPoemForViewer(id);
    return {
      title: poem.title,
      // Описание для поисковиков и превью ссылки — первая строка стиха
      description: poem.text.split("\n")[0]?.slice(0, 160),
    };
  } catch {
    // Стиха нет или нет доступа — страница сама покажет notFound(),
    // а здесь просто нейтральный заголовок
    return { title: "Poem not found" };
  }
}


export default async function PoemPage(props: PageProps<"/poems/[id]">) {
  const { id } = await props.params;

  let poem;
  try {
    // Опубликованный — всем; черновик/скрытый — автору (и скрытый — модераторам)
    poem = await getPoemForViewer(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const author = poem.author as typeof poem.author & AuthorExtras;
  const firstName = author.displayName.split(" ")[0];

  const publishedDate = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(poem.publishedAt));

  // Текущий пользователь из httpOnly-cookie; null — гость (может только читать)
  const viewer: User | null = await getCurrentUser();

  const isPublished = poem.status === "PUBLISHED";
  const isAuthor = viewer?.id === author.id;
  // Закрашено ли сердце: спрашиваем бэкенд только у вошедшего и только для опубликованного
  const isLiked = viewer && isPublished ? await getIsLiked(poem.id) : false;
  const hiddenByModerator = poem.status === "ARCHIVED" && poem.hiddenById !== author.id;

  // TODO: другие поэмы автора, например getPoems({ author: author.username, limit: 3 }),
  // без текущей. Пока пусто — карточка «More from» не показывается.
  const morePoems: MorePoem[] = [];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        {/* ---------- Левая колонка ---------- */}
        <div className="min-w-0">
          <article className={`${card} px-6 py-9 sm:px-12 sm:py-12`}>
            {!isPublished && (
              <StatusBanner
                poemId={poem.id}
                status={poem.status}
                isAuthor={isAuthor}
                hiddenByModerator={hiddenByModerator}
              />
            )}

            <header>
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-berry">
                  Poem · {poem.readingMinutes} min read
                </p>
                {/* Меню «⋯» (Edit / Hide / Unhide) — само решает, что показать этому пользователю */}
                <div className="-mr-2 -mt-2">
                  <PoemActions
                    poem={{
                      id: poem.id,
                      status: poem.status,
                      hiddenById: poem.hiddenById,
                      authorId: author.id,
                    }}
                    viewer={viewer}
                  />
                </div>
              </div>

              <h1 className="mt-4 text-balance font-serif text-4xl leading-tight text-ink sm:text-5xl">
                {poem.title}
              </h1>

              <p className="mt-4 font-serif text-lg italic text-ink-muted">
                by{" "}
                <Link
                  href={`/authors/${author.username}`}
                  className="focus-ring rounded transition-colors hover:text-ink"
                >
                  {author.displayName}
                </Link>
                <span aria-hidden> · </span>
                <time dateTime={poem.publishedAt} title={publishedDate}>
                  {formatRelativeDate(poem.publishedAt)}
                </time>
              </p>
            </header>

            <hr className="my-8 border-0 border-t border-leaf/40" />

            <div className="whitespace-pre-line break-words px-1 font-serif poem-text text-ink sm:px-2">
              {poem.text}
            </div>

            {poem.tags.length > 0 && (
              <ul className="mt-10 flex flex-wrap gap-2">
                {poem.tags.map((tag) => (
                  <li key={tag.slug}>
                    <TagBadge tag={tag} />
                  </li>
                ))}
              </ul>
            )}

            <hr className="my-7 border-0 border-t border-leaf/40" />

            <footer className="flex flex-wrap gap-3">
              {/* Лайкать можно только опубликованный стих; у черновика/скрытого — просто число */}
              {isPublished ? (
                <LikeButton
                  poemId={poem.id}
                  initialLiked={isLiked}
                  initialCount={poem.stats.likes}
                  signedIn={!!viewer}
                />
              ) : (
                <span className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-ink">
                  <HeartIcon className="h-4 w-4 text-berry" />
                  {formatCount(poem.stats.likes)} likes
                </span>
              )}
              {/* Делиться и жаловаться есть смысл только на опубликованный стих */}
              {isPublished && <ShareButton title={poem.title} />}
              {/* Пожаловаться может только вошедший и не на свой стих */}
              {isPublished && viewer && !isAuthor && (
                <ReportPoemButton
                  poemId={poem.id}
                  title={poem.title}
                  excerpt={poem.text.split("\n").slice(0, 4).join("\n")}
                  authorName={author.displayName}
                />
              )}
            </footer>
          </article>

          {/* API комментариев работает только для опубликованных стихов */}
          {isPublished && (
            <CommentSection
              poemId={poem.id}
              initialCount={poem.stats.comments}
              viewer={viewer}
            />
          )}
        </div>

        {/* ---------- Боковая панель ---------- */}
        <aside className="space-y-5 lg:sticky lg:top-24">
          <section className={`${card} p-6`}>
            <Link
              href={`/authors/${author.username}`}
              className="focus-ring flex items-center gap-3 rounded-2xl"
            >
              <Avatar src={author.avatarUrl} name={author.displayName} />
              <span className="min-w-0">
                <span className="block truncate font-serif text-xl text-ink">
                  {author.displayName}
                </span>
                <span className="block truncate text-xs text-ink-muted">
                  @{author.username}
                </span>
              </span>
            </Link>

            {author.bio && (
              <p className="mt-4 text-sm leading-relaxed text-ink-muted">{author.bio}</p>
            )}

            {/* Если появится эндпоинт подписки — здесь будет кнопка Follow */}
            <Link
              href={`/authors/${author.username}`}
              className="glass-pill focus-ring mt-5 flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium text-ink"
            >
              View profile
              {typeof author.followersCount === "number" &&
                ` · ${formatCount(author.followersCount)}`}
            </Link>
          </section>

          {morePoems.length > 0 && (
            <section className={`${card} p-6`}>
              <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-ink-muted">
                More from {firstName}
              </h2>
              <ul className="mt-3 space-y-1">
                {morePoems.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/poems/${p.id}`}
                      className="focus-ring block rounded-xl px-2 py-2 transition-colors hover:bg-[var(--glass-hover)]"
                    >
                      <span className="block font-serif text-lg text-ink">{p.title}</span>
                      <span className="block text-xs text-ink-muted">
                        {formatCount(p.likes)} likes
                        {p.label && ` · ${p.label}`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}

/** Плашка над заголовком у черновика и скрытого стиха */
function StatusBanner({
  poemId,
  status,
  isAuthor,
  hiddenByModerator,
}: {
  poemId: string;
  status: Poem["status"];
  isAuthor: boolean;
  hiddenByModerator: boolean;
}) {
  const isDraft = status === "DRAFT";
  const text = isDraft
    ? "Draft — only you can see it."
    : isAuthor && hiddenByModerator
      ? "Hidden by a moderator. Only moderators can bring it back."
      : "Hidden — only you and moderators can see it.";

  return (
    <div
      role="status"
      className={`mb-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl border px-4 py-3 text-sm ${
        isDraft
          ? "border-leaf/50 bg-leaf/10 text-leaf-deep"
          : "border-berry/30 bg-berry/10 text-berry"
      }`}
    >
      <span>
        <span className="mr-2 text-xs font-medium uppercase tracking-[0.18em]">
          {isDraft ? "Draft" : "Hidden"}
        </span>
        {text}
      </span>
      {isDraft && isAuthor && (
        <Link
          href={`/poems/${poemId}/edit`}
          className="focus-ring rounded-full font-medium underline underline-offset-4 hover:text-ink"
        >
          Continue editing
        </Link>
      )}
    </div>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z"
      />
    </svg>
  );
}