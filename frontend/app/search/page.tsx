import { PoemFeed } from "@/components/poems/PoemsFeeds";
import { getPoems } from "@/lib/poems";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  if (!query) {
    return (
      <main className="mx-auto w-full max-w-[90rem] px-6 py-12">
        <h1 className="mb-4 font-serif text-3xl">Search</h1>
        <p className="text-ink-muted">
          Type a title, a line or an author's name in the search bar above.
        </p>
      </main>
    );
  }

  let poems;
  try {
    poems = await getPoems({ q: query });
  } catch (error) {
    console.error(error);
    return (
      <main className="mx-auto w-full max-w-[90rem] px-6 py-12">
        <p className="py-12 text-center text-ink-muted">
          Search failed. Try again in a moment.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[90rem] px-6 py-12">
      <h1 className="mb-8 font-serif text-3xl">Results for “{query}”</h1>
      <PoemFeed
        poems={poems}
        title={`${poems.length} found`}
        emptyMessage={`Nothing found for “${query}”. Try another word.`}
      />
    </main>
  );
}