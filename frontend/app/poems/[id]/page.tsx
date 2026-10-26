import Link from "next/link";
import { getPoem } from "@/lib/poems";
import { TagBadge } from "@/components/ui/TagBadge";
import { Avatar } from "@/components/ui/Avatar";
import { ApiError } from "@/lib/poem-api";
import { notFound } from "next/navigation";
import { formatCount, formatRelativeDate } from "@/lib/utils";



export default async function PoemPage(props: PageProps<"/poems/[id]">) {
  const { id } = await props.params;

  let poem;
  try{
    poem = await getPoem(id)
  }catch(error){
    if(error instanceof ApiError && error.status === 404){
      notFound()
    }
    throw error
  }
  const publishedDate = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(poem.publishedAt));


  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <article>
        <header className="mb-10">
          <h1 className="mb-6 font-serif text-4xl leading-tight sm:text-5xl">
            {poem.title}
          </h1>

          <Link
            href={`/authors/${poem.author.username}`}
            className="focus-ring inline-flex items-center gap-3 rounded-xl"
          >
            {/* Подставьте пропсы так же, как Avatar используется в PoemCard */}
            <Avatar src={poem.author.avatarUrl} name={poem.author.displayName} />
            <span>
              <span className="block text-sm text-[var(--ink)]">
                {poem.author.displayName}
              </span>
              <span className="block text-xs text-[var(--ink-muted)]">
                {formatRelativeDate(poem.publishedAt)} · {poem.readingMinutes} min
              </span>
            </span>
          </Link>
        </header>

        <div className="whitespace-pre-line font-serif text-lg leading-loose text-[var(--ink)]">
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

        <footer className="mt-8 flex items-center gap-6 border-t border-leaf/40 pt-6 text-sm text-[var(--ink-muted)]">
          <span>♡ {poem.stats.likes}</span>
          <span>💬 {poem.stats.comments}</span>
        </footer>
      </article>
    </main>
  );
}


