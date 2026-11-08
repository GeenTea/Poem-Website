"use client";

import { useEffect, useId, useRef, useState } from "react";

export type CommentMenuItem = {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
};

/** Кнопка «⋯» с выпадающим списком действий над комментарием. */
export function CommentMenu({ items }: { items: CommentMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Закрываем по клику снаружи и по Escape
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Comment actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-[var(--glass-hover)] hover:text-ink"
      >
        <DotsIcon className="h-4 w-4" />
      </button>

      {open && (
        <ul
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-36 overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-white/95 py-1 shadow-lg backdrop-blur"
        >
          {items.map((item) => (
            <li key={item.label} role="none">
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[var(--glass-hover)] disabled:opacity-50 ${
                  item.danger ? "text-berry" : "text-ink"
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DotsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}
