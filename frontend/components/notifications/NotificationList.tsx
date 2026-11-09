"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeDate } from "@/lib/utils";
import { emitNotificationsChanged, notificationsApi } from "@/lib/notifications-api";
import type { AppNotification } from "@/types/notification";

const card = "auth-card rounded-[24px] bg-[var(--glass)]";

/** Текст и ссылка уведомления в зависимости от типа. */
function describe(n: AppNotification): { text: string; href: string } {
  const title = n.poem ? `“${n.poem.title}”` : "your poem";
  const poemHref = n.poem ? `/poems/${n.poem.id}` : "/";

  switch (n.type) {
    case "POEM_LIKE":
      return { text: `liked your poem ${title}`, href: poemHref };
    case "POEM_COMMENT":
      return { text: `left a note on ${title}`, href: `${poemHref}#comments` };
    case "COMMENT_REPLY":
      return { text: `replied to your note on ${title}`, href: `${poemHref}#comments` };
    case "COMMENT_LIKE":
      return { text: `liked your note on ${title}`, href: `${poemHref}#comments` };
    case "FOLLOW":
      return { text: "started following you", href: `/authors/${n.actor.username}` };
  }
}

export function NotificationList() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");

  const load = useCallback((nextPage: number) => {
    notificationsApi
      .list(nextPage)
      .then((data) => {
        setItems((prev) => {
          const base = nextPage === 1 ? [] : prev;
          const seen = new Set(base.map((n) => n.id));
          return [...base, ...data.items.filter((n) => !seen.has(n.id))];
        });
        setPage(nextPage);
        setHasMore(data.hasMore);
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  function loadMore() {
    setStatus("loading");
    load(page + 1);
  }

  function markLocallyRead(predicate: (n: AppNotification) => boolean) {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (predicate(n) && !n.readAt ? { ...n, readAt: now } : n)));
  }

  async function markAllRead() {
    markLocallyRead(() => true);
    try {
      await notificationsApi.markAllRead();
    } finally {
      emitNotificationsChanged();
    }
  }

  function openNotification(n: AppNotification) {
    if (n.readAt) return;
    markLocallyRead((x) => x.id === n.id);
    // Переход по ссылке не ждём — отметка уйдёт в фоне
    notificationsApi.markRead(n.id).then(emitNotificationsChanged, () => {});
  }

  const hasUnread = items.some((n) => !n.readAt);

  return (
    <section className={`${card} p-4 sm:p-6`}>
      <div className="mb-4 flex items-center justify-between gap-3 px-2">
        <h1 className="font-serif text-3xl text-ink">Notifications</h1>
        {hasUnread && (
          <button
            type="button"
            onClick={markAllRead}
            className="focus-ring rounded-full px-3 py-1.5 text-sm font-medium text-berry hover:bg-[var(--glass-hover)]"
          >
            Mark all as read
          </button>
        )}
      </div>

      {status === "loading" && items.length === 0 && (
        <p className="px-2 py-10 text-center text-sm text-ink-muted">Loading…</p>
      )}

      {status === "idle" && items.length === 0 && (
        <p className="px-2 py-10 text-center font-serif text-lg italic text-ink-muted">
          Nothing here yet. Likes, notes and new followers will show up here.
        </p>
      )}

      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((n) => {
            const { text, href } = describe(n);
            const name = n.actor.displayName || n.actor.username;
            const unread = !n.readAt;
            return (
              <li key={n.id}>
                <Link
                  href={href}
                  onClick={() => openNotification(n)}
                  className={`focus-ring flex items-start gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-[var(--glass-hover)] ${
                    unread ? "bg-white/40" : ""
                  }`}
                >
                  <Avatar src={n.actor.avatarUrl} name={name} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-ink">
                      <span className="font-medium">{name}</span> {text}
                    </span>
                    {n.comment && n.type !== "COMMENT_LIKE" && (
                      <span className="mt-1 block truncate font-serif italic text-ink-muted">
                        {n.comment.content}
                      </span>
                    )}
                    <time dateTime={n.createdAt} className="mt-1 block text-xs text-ink-muted">
                      {formatRelativeDate(n.createdAt)}
                    </time>
                  </span>
                  {unread && (
                    <span aria-label="Unread" className="mt-2 size-2.5 shrink-0 rounded-full bg-berry" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {status === "error" && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-ink-muted">
          Couldn&apos;t load notifications.
          <button
            type="button"
            onClick={() => {
              setStatus("loading");
              load(items.length ? page + 1 : 1);
            }}
            className="focus-ring rounded-full px-3 py-1 font-medium text-berry hover:bg-[var(--glass-hover)]"
          >
            Try again
          </button>
        </div>
      )}

      {hasMore && status !== "error" && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={status === "loading"}
            className="glass-pill focus-ring rounded-full px-5 py-2 text-sm text-ink disabled:opacity-60"
          >
            {status === "loading" ? "Loading…" : "Show more"}
          </button>
        </div>
      )}
    </section>
  );
}
