import { Sparkles } from "lucide-react";
import type { Poem } from "@/types/poem";
import { getPoems } from "@/lib/poems";
import { PoemCard } from "./PoemCard";

export async function PoemFeed() {
  let poems: Poem[];

  try {
    poems = await getPoems();
  } catch (error) {
    console.error(error);
    return (
      <p className="py-12 text-center text-ink-muted">
        Не удалось загрузить стихи. Попробуйте обновить страницу.
      </p>
    );
  }

  return (
    <section aria-labelledby="feed-heading" className="mx-auto w-full max-w-[90rem] px-6 py-12">
      <h2 id="feed-heading" className="mb-6 flex items-center gap-2 text-sm text-ink-muted">
        <Sparkles className="size-4 text-leaf-deep" aria-hidden />
        Свежее
      </h2>

      {poems.length === 0 ? (
        <p className="py-12 text-center text-ink-muted">
          Пока здесь пусто. Опубликуйте первый стих!
        </p>
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