import Link from "next/link";
import type { Tag } from "@/types/poem";
import { cn } from "@/lib/utils";

interface TagFilterProps {
  tags: Tag[];
  activeSlug?: string;
}

const chipBase =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-4xl border px-4 text-xs transition-colors focus-ring";
const chipIdle = "border-leaf bg-cream text-leaf-deep hover:bg-leaf/15";
const chipActive = "border-leaf-deep bg-leaf-deep text-cream";

export function TagFilter({ tags, activeSlug }: TagFilterProps) {
  return (
    <nav aria-label="Filter poems by tag" className="mb-8">
      <ul className="flex gap-2 overflow-x-auto pb-2">
        <li>
          <Link
            href="/"
            scroll={false}
            aria-current={!activeSlug ? "page" : undefined}
            className={cn(chipBase, !activeSlug ? chipActive : chipIdle)}
          >
            All
          </Link>
        </li>

        {tags.map((tag) => {
          const isActive = tag.slug === activeSlug;
          return (
            <li key={tag.slug}>
              <Link
                href={`/?tag=${encodeURIComponent(tag.slug)}`}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className={cn(chipBase, isActive ? chipActive : chipIdle)}
              >
                {tag.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}