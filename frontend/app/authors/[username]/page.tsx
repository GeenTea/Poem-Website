import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAuthorProfile, getIsFollowing, getPoems } from "@/lib/poems";
import { getCurrentUser } from "@/lib/auth";
import { ApiError } from "@/lib/poem-api";
import { Avatar } from "@/components/ui/Avatar";
import { PoemCard } from "@/components/poems/PoemCard";
import { FollowButton } from "@/components/authors/FollowButton";
import { formatCount } from "@/lib/utils";
import type { AuthorProfile } from "@/types/user";

const card = "auth-card rounded-[28px] bg-[var(--glass)]";

/** Профиль или 404 (несуществующий автор) */
async function loadProfile(username: string): Promise<AuthorProfile> {
  try {
    return await getAuthorProfile(username);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

// Заголовок вкладки — имя автора. Тот же запрос, что и в странице,
// Next.js мемоизирует, поэтому к бэкенду он уйдёт один раз.
export async function generateMetadata(props: PageProps<"/authors/[username]">): Promise<Metadata> {
  const { username } = await props.params;
  try {
    const profile = await getAuthorProfile(username);
    return {
      title: profile.displayName || profile.username,
      description: profile.bio ?? undefined,
    };
  } catch {
    return { title: "Author not found" };
  }
}

export default async function AuthorPage(props: PageProps<"/authors/[username]">) {
  const { username } = await props.params;

  const [profile, viewer] = await Promise.all([loadProfile(username), getCurrentUser()]);
  const [poems, isFollowing] = await Promise.all([
    getPoems({ author: profile.username }),
    viewer && viewer.id !== profile.id ? getIsFollowing(profile.id) : Promise.resolve(false),
  ]);

  const name = profile.displayName || profile.username;
  const isOwnProfile = viewer?.id === profile.id;
  const joined = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
    new Date(profile.createdAt),
  );

  const stats = [
    { label: "Poems", value: profile.stats.poems },
    { label: "Followers", value: profile.stats.followers },
    { label: "Following", value: profile.stats.following },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 ">
      {/* ---------- Карточка профиля ---------- */}
      <section aria-labelledby="author-name" className={`${card} p-6 sm:p-8`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar src={profile.avatarUrl} name={name} size="xl" className="ring-1 ring-[var(--glass-border)]" />

          <div className="min-w-0 flex-1">
            <h1 id="author-name" className="font-serif text-3xl leading-tight text-ink sm:text-4xl">
              {name}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">@{profile.username}</p>

            {profile.bio && (
              <p className="mt-4 max-w-xl font-serif text-lg leading-relaxed text-ink">{profile.bio}</p>
            )}

            <p className="mt-4 flex items-center gap-1.5 text-sm text-ink-muted">
              <CalendarIcon className="h-4 w-4" />
              Joined {joined}
            </p>
          </div>

          {/* Действия справа: чужой профиль — Follow, свой — Edit profile, гость — Follow ведёт на вход */}
          <div className="flex shrink-0 gap-2 sm:flex-col">
            {isOwnProfile ? (
              <Link
                href="/profile/settings"
                className="glass-pill focus-ring rounded-full px-5 py-2 text-center text-sm font-medium text-ink"
              >
                Edit profile
              </Link>
            ) : viewer ? (
              <FollowButton authorId={profile.id} initialFollowing={isFollowing} />
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(`/authors/${profile.username}`)}`}
                className="focus-ring min-w-28 rounded-full bg-berry px-5 py-2 text-center text-sm font-medium text-white transition hover:brightness-110"
              >
                Follow
              </Link>
            )}
          </div>
        </div>

        {/* ---------- Статистика ---------- */}
        <dl className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-[var(--glass-border)] bg-surface px-4 py-3 shadow-[var(--glass-highlight)] sm:px-5 sm:py-4"
            >
              <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                {s.label}
              </dt>
              <dd className="mt-1 font-serif text-2xl text-ink">{formatCount(s.value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- Стихи автора ---------- */}
      <section aria-labelledby="poems-heading" className="mt-10">
        <h2 id="poems-heading" className="mb-5 font-serif text-2xl text-ink">
          Published poems
        </h2>

        {poems.length === 0 ? (
          <div className={`${card} px-6 py-12 text-center`}>
            <p className="font-serif text-lg italic text-ink-muted">
              {isOwnProfile ? "You haven't published anything yet." : `${name} hasn't published anything yet.`}
            </p>
            {isOwnProfile && (
              <Link
                href="/poems/new"
                className="focus-ring mt-5 inline-flex rounded-full bg-berry px-5 py-2 text-sm font-medium text-white transition hover:brightness-110"
              >
                Write a poem
              </Link>
            )}
          </div>
        ) : (
          // Колонки (masonry), как в ленте: карточки разной высоты не оставляют дыр
          <div className="columns-1 gap-6 md:columns-2">
            {poems.map((poem) => (
              <div key={poem.id} className="mb-6 break-inside-avoid">
                <PoemCard poem={poem} viewer={viewer} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path strokeLinecap="round" d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}
