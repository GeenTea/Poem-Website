import Link from "next/link";
import type { Tag } from "@/types/poem";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  tag: Tag;
  className?: string;
}

export function TagBadge({ tag, className }: TagBadgeProps) {
  return (
    <Link
      href={`/tags/${tag.slug}`}
      className={cn(
        "relative z-10 flex h-9 min-w-[6.06rem] items-center justify-center px-3",
        "border border-leaf bg-cream rounded-4xl text-xs text-leaf-deep backdrop-blur-[2px]",
        "transition-colors hover:bg-leaf/15 focus-ring",
        className,
      )}
    >
      {tag.name}
    </Link>
  );
}