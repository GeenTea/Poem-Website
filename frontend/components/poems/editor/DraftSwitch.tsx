"use client";

import { cn } from "@/lib/utils";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  description: string;
};

/** Переключатель «Keep as draft» — настоящая кнопка role="switch" со всей строкой как зоной клика */
export function DraftSwitch({ checked, onChange, disabled, label, description }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "glass-pill focus-ring flex w-full items-center gap-4 rounded-[20px] px-4 py-3.5 text-left",
        "disabled:cursor-not-allowed disabled:opacity-60",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors",
          checked ? "border-berry bg-berry" : "border-[var(--glass-border)] bg-ink/10",
        )}
      >
        <span
          className={cn(
            "absolute h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none",
            checked ? "translate-x-[22px]" : "translate-x-[3px]",
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block text-xs leading-snug text-ink-muted">{description}</span>
      </span>
    </button>
  );
}
