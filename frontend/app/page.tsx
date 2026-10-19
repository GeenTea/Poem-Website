import { Hero } from "@/components/layout/Hero";
import { PoemFeed } from "@/components/poems/PoemsFeeds";
import { TagFilter } from "@/components/poems/TagFilter";
import { getPoems, getTags } from "@/lib/poems";

interface HomePageProps {
  searchParams: Promise<{ tag?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { tag } = await searchParams;

  let data;
  try {
    data = await Promise.all([
      getPoems(tag), 
      getTags().catch((error) => {
        console.error(error); 
        return[];
      })
    ]);
  } catch (error) {
    console.error(error);
    return (
      <main className="mx-auto w-full max-w-[90rem] px-6 py-12">
        <p className="py-12 text-center text-ink-muted">
          Failed to load the poems. Try refreshing the page.
        </p>
      </main>
    );
  }

  const [poems, tags] = data;

  return (
    <main className="mx-auto w-full max-w-[90rem] px-6 py-12">
      <Hero />
      <TagFilter tags={tags} activeSlug={tag} />
      <PoemFeed
        poems={poems}
        emptyMessage={tag ? "No poems with this tag yet." : undefined}
      />
    </main>
  );
}