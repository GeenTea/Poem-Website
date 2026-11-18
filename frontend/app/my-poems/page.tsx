import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, MessageCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getMyPoems } from "@/lib/poems";
import { formatCount, formatRelativeDate } from "@/lib/utils";
import { PoemActions, type PoemActionsViewer } from "@/components/poems/PoemActions";
import type { Poem } from "@/types/poem";

export const metadata = { title: "My poems" };

const card = "auth-card rounded-[24px] bg-[var(--glass)]";
const primaryPill =
  "focus-ring inline-flex items-center rounded-full bg-berry px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90";

// Вкладки: ключ в адресе (?status=...) → подпись и фильтр
const TABS = [
  { key: "all", label: "All", filter: () => true },
  { key: "published", label: "Published", filter: (p: Poem) => p.status === "PUBLISHED" },
  { key: "drafts", label: "Drafts", filter: (p: Poem) => p.status === "DRAFT" },
  { key: "hidden", label: "Hidden", filter: (p: Poem) => p.status === "ARCHIVED" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const EMPTY_TEXT: Record<TabKey, string> = {
  all: "You haven't written any poems yet.",
  published: "No published poems yet.",
  drafts: "No drafts. Every poem you save as a draft will wait here.",
  hidden: "No hidden poems.",
};

export default async function MyPoemsPage(props: PageProps<"/my-poems">) {
  // Гостя — на вход, а после входа вернём сюда
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=" + encodeURIComponent("/my-poems"));

  // searchParams — Promise; неизвестное значение превращаем в «all»
  const { status } = await props.searchParams;
  const active = TABS.find((t) => t.key === status) ?? TABS[0];

  let poems: Poem[];
  try {
    poems = await getMyPoems();
  } catch (error) {
    console.error(error);
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <PageHeader />
        <p className="py-12 text-center text-ink-muted">
          Failed to load your poems. Try refreshing the page.
        </p>
      </main>
    );
  }

  const visible = poems.filter(active.filter);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader />

      <nav aria-label="Filter poems by status" className="mt-8">
        <ul className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const isActive = tab.key === active.key;
            const count = poems.filter(tab.filter).length;
            return (
              <li key={tab.key}>
                <Link
                  href={tab.key === "all" ? "/my-poems" : `/my-poems?status=${tab.key}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`focus-ring inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-berry text-white" : "glass-pill text-ink hover:bg-[var(--glass-hover)]"
                  }`}
                >
                  {tab.label}
                  <span className={isActive ? "text-white/80" : "text-ink-muted"}>{count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {visible.length === 0 ? (
        <div className={`${card} mt-6 px-6 py-12 text-center`}>
          <p className="text-ink-muted">{EMPTY_TEXT[active.key]}</p>
          <Link href="/poems/new" className={`${primaryPill} mt-5`}>
            Write a poem
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {visible.map((poem) => (
            <li key={poem.id}>
              <MyPoemRow poem={poem} viewer={user} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function PageHeader() {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-berry">Your library</p>
        <h1 className="mt-2 font-serif text-4xl text-ink">My poems</h1>
      </div>
      <Link href="/poems/new" className={primaryPill}>
        Write a poem
      </Link>
    </header>
  );
}

/** Одна строка списка: заголовок, статус, дата, счётчики и меню «⋯» */
function MyPoemRow({ poem, viewer }: { poem: Poem; viewer: PoemActionsViewer }) {
  return (
    <article className={`${card} flex items-start gap-3 px-5 py-4 sm:px-6`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="min-w-0 font-serif text-xl text-ink">
            <Link href={`/poems/${poem.id}`} className="focus-ring rounded hover:underline">
              {poem.title}
            </Link>
          </h2>
          <StatusBadge poem={poem} />
        </div>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
          <span>
            Updated <time dateTime={poem.updatedAt}>{formatRelativeDate(poem.updatedAt)}</time>
          </span>
          <span className="flex items-center gap-1" aria-label={`Likes: ${poem.stats.likes}`}>
            <Heart className="size-3.5" aria-hidden />
            {formatCount(poem.stats.likes)}
          </span>
          <span className="flex items-center gap-1" aria-label={`Comments: ${poem.stats.comments}`}>
            <MessageCircle className="size-3.5" aria-hidden />
            {formatCount(poem.stats.comments)}
          </span>
        </p>
      </div>

      <PoemActions
        poem={{ id: poem.id, status: poem.status, hiddenById: poem.hiddenById, authorId: poem.author.id }}
        viewer={viewer}
      />
    </article>
  );
}

function StatusBadge({ poem }: { poem: Poem }) {
  const base = "rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium uppercase tracking-[0.14em]";

  if (poem.status === "PUBLISHED") {
    return <span className={`${base} bg-leaf/15 text-leaf-deep`}>Published</span>;
  }
  if (poem.status === "DRAFT") {
    return <span className={`${base} bg-[var(--glass-hover)] text-ink-muted`}>Draft</span>;
  }
  // Скрыт: сам автор или модератор
  const byModerator = poem.hiddenById !== poem.author.id;
  return (
    <span className={`${base} bg-berry/10 text-berry`}>
      {byModerator ? "Hidden by moderator" : "Hidden"}
    </span>
  );
}
