"use client";

import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href.split("#")[0];

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
      } catch {
        // пользователь закрыл окно — ничего не делаем
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // буфер обмена недоступен
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="glass-pill focus-ring inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ink-muted hover:text-ink"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4" aria-hidden>
        <circle cx="18" cy="5" r="2.5" />
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="19" r="2.5" />
        <path strokeLinecap="round" d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" />
      </svg>
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}