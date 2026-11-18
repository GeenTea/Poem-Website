"use client";

import type { Tag } from "@/types/poem";
import { cn } from "@/lib/utils";

type Props = {
  tags: Tag[];
  selected: string[];
  max: number;
  onToggle: (slug: string) => void;
  disabled?: boolean;
};

/** Чипы всех тегов: невыбранный — стеклянная пилюля с «+», выбранный — в цвете berry с «✓» */
export function TagPicker({ tags, selected, max, onToggle, disabled }: Props) {
  const full = selected.length >= max;

  if (tags.length === 0) {
    return <p className="mt-3 text-sm text-ink-muted">No tags yet.</p>;
  }

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {tags.map((tag) => {
        const active = selected.includes(tag.slug);
        const blocked = disabled || (!active && full);
        return (
          <li key={tag.slug}>
            <button
              type="button"
              aria-pressed={active}
              disabled={blocked}
              onClick={() => onToggle(tag.slug)}
              title={!active && full ? `Up to ${max} tags` : undefined}
              className={cn(
                "focus-ring inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors",
                active
                  ? "border border-berry/50 bg-berry/10 font-medium text-berry hover:bg-berry/15"
                  : "glass-pill text-ink-muted hover:text-ink",
                "disabled:cursor-not-allowed disabled:opacity-45",
              )}
            >
              <span aria-hidden className="text-[0.95em] leading-none">
                {active ? "✓" : "+"}
              </span>
              {tag.name}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
