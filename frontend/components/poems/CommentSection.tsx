"use client";

import { useCallback, useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { formatCount, formatRelativeDate } from "@/lib/utils";
import {
  COMMENTS_PAGE_SIZE,
  COMMENT_MAX_LENGTH,
  commentErrorMessage,
  commentsApi,
  withViewer,
} from "@/lib/comments-api";
import type { CommentViewer, PoemComment } from "@/types/comment";
import { CommentMenu, type CommentMenuItem } from "@/components/poems/CommentMenu";

type Props = {
  poemId: string;
  initialCount: number;
  viewer?: CommentViewer | null;
};

const cardClass = "auth-card rounded-[24px] bg-[var(--glass)]";

/* ---------------- section ---------------- */

export function CommentSection({ poemId, initialCount, viewer = null }: Props) {
  const [comments, setComments] = useState<PoemComment[]>([]);
  const [count, setCount] = useState(initialCount);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");

  const load = useCallback(
    async (nextPage: number) => {
      try {
        const data = await commentsApi.list(poemId, nextPage);
        const topLevel = data.filter((c) => !c.parentId);
        setComments((prev) => {
          const base = nextPage === 1 ? [] : prev;
          const seen = new Set(base.map((c) => c.id));
          return [...base, ...topLevel.filter((c) => !seen.has(c.id))];
        });
        setPage(nextPage);
        setHasMore(data.length === COMMENTS_PAGE_SIZE);
        setStatus("idle");
      } catch {
        setStatus("error");
      }
    },
    [poemId],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  function retry() {
    setStatus("loading");
    void load(comments.length ? page + 1 : 1);
  }

  function loadMore() {
    setStatus("loading");
    void load(page + 1);
  }

  async function addComment(content: string) {
    const created = await commentsApi.create(poemId, content);
    setComments((prev) => [withViewer(created, viewer), ...prev]);
    setCount((c) => c + 1);
  }

  function replaceComment(updated: PoemComment) {
    setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  function removeComment(id: string) {
    setComments((prev) => prev.filter((c) => c.id !== id));
    setCount((c) => Math.max(0, c - 1));
  }

  const isInitialLoading = status === "loading" && comments.length === 0;

  return (
    <section id="comments" aria-labelledby="comments-title" className="mt-12 scroll-mt-24">
      <h2 id="comments-title" className="mb-5 flex items-center gap-2.5 font-serif text-2xl text-ink">
        <ChatIcon className="h-5 w-5 text-berry" />
        {formatCount(count)} {count === 1 ? "note" : "notes"}
      </h2>

      {viewer ? (
        <div className={`${cardClass} p-5`}>
          <CommentForm
            onSubmit={addComment}
            submitLabel="Post note"
            placeholder="Leave a note about a line that stayed with you…"
          />
        </div>
      ) : (
        <div className={`${cardClass} flex flex-col items-center gap-3 px-6 py-6 text-center sm:flex-row sm:justify-between sm:text-left`}>
          <p className="font-serif text-lg italic text-ink-muted">
            Sign in to leave a note about a line that stayed with you.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(`/poems/${poemId}#comments`)}`}
            className="focus-ring shrink-0 rounded-full bg-berry px-5 py-2 text-sm font-medium text-white transition hover:brightness-110"
          >
            Sign in
          </Link>
        </div>
      )}

      <div className="mt-5">
        {isInitialLoading && <CommentsSkeleton />}

        {status === "idle" && comments.length === 0 && (
          <p className="py-10 text-center font-serif text-lg italic text-ink-muted">
            No notes yet. Be the first to respond.
          </p>
        )}

        {comments.length > 0 && (
          <ul className="space-y-4">
            {comments.map((comment) => (
              <li key={comment.id} className={`${cardClass} p-5`}>
                <CommentItem
                  comment={comment}
                  poemId={poemId}
                  viewer={viewer}
                  onUpdated={replaceComment}
                  onDeleted={removeComment}
                  onCountChange={(delta) => setCount((c) => Math.max(0, c + delta))}
                />
              </li>
            ))}
          </ul>
        )}

        {status === "error" && (
          <div className="mt-4 flex items-center justify-center gap-3 text-sm text-ink-muted">
            Couldn&apos;t load notes.
            <button
              type="button"
              onClick={retry}
              className="focus-ring rounded-full px-3 py-1 font-medium text-berry hover:bg-[var(--glass-hover)]"
            >
              Try again
            </button>
          </div>
        )}

        {hasMore && status !== "error" && comments.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={status === "loading"}
              className="glass-pill focus-ring rounded-full px-5 py-2 text-sm text-ink disabled:opacity-60"
            >
              {status === "loading" ? "Loading…" : "Show more notes"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- item ---------------- */

type ItemProps = {
  comment: PoemComment;
  poemId: string;
  viewer: CommentViewer | null;
  onUpdated: (comment: PoemComment) => void;
  onDeleted: (id: string) => void;
  onCountChange: (delta: number) => void;
};

function CommentItem({ comment, poemId, viewer, onUpdated, onDeleted, onCountChange }: ItemProps) {
  const isReply = Boolean(comment.parentId);
  const [mode, setMode] = useState<"view" | "edit" | "reply">("view");
  const [replies, setReplies] = useState<PoemComment[] | null>(null);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const author = comment.author;
  const name = author?.displayName || author?.username || "Reader";
  const [notice, setNotice] = useState<string | null>(null);
  const isOwner = viewer?.id === comment.authorId;
  const canDelete = isOwner || viewer?.role === "ADMIN" || viewer?.role === "MODERATOR";
  const replyCount = replies?.length ?? comment._count?.replies;

  async function loadReplies() {
    setRepliesLoading(true);
    setError(null);
    try {
      const data = await commentsApi.replies(poemId, comment.id);
      setReplies([...data].reverse()); // бэкенд отдаёт desc, в ветке читаем сверху вниз
      setRepliesOpen(true);
    } catch (err) {
      setError(commentErrorMessage(err));
    } finally {
      setRepliesLoading(false);
    }
  }

  function toggleReplies() {
    if (repliesOpen) return setRepliesOpen(false);
    if (replies) return setRepliesOpen(true);
    void loadReplies();
  }

  async function handleEdit(content: string) {
    const updated = await commentsApi.update(poemId, comment.id, content);
    onUpdated({ ...comment, ...updated, author: updated.author ?? comment.author });
    setMode("view");
  }

  async function handleReply(content: string) {
    const created = withViewer(await commentsApi.create(poemId, content, comment.id), viewer);
    setMode("view");
    onCountChange(1);
    if (replies) {
      setReplies((prev) => [...(prev ?? []), created]);
      setRepliesOpen(true);
    } else {
      await loadReplies();
    }
  }

  // ЗАГЛУШКА: на бэкенде пока нет эндпоинта жалоб (см. Issues-Pending.md).
  // Когда появится — добавить commentsApi.report(poemId, comment.id, reason) и вызвать его здесь.
  function handleReport() {
    setError(null);
    setNotice("Thanks — reporting will be available soon.");
  }

  async function handleDelete() {
    if (!window.confirm("Delete this note?")) return;
    setDeleting(true);
    setError(null);
    try {
      await commentsApi.remove(poemId, comment.id);
      onDeleted(comment.id);
    } catch (err) {
      setError(commentErrorMessage(err));
      setDeleting(false);
    }
  }

  // Гостю меню не показываем: и редактирование, и жалоба требуют входа
  const menuItems: CommentMenuItem[] = [];
  if (viewer) {
    if (isOwner) menuItems.push({ label: "Edit", onSelect: () => setMode("edit") });
    if (canDelete) menuItems.push({ label: "Delete", onSelect: handleDelete, danger: true, disabled: deleting });
    if (!isOwner) menuItems.push({ label: "Report", onSelect: handleReport });
  }

  const actionClass =
    "focus-ring rounded-full px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-[var(--glass-hover)] hover:text-ink disabled:opacity-50";

  const authorBlock = (
    <>
      <Avatar src={author?.avatarUrl ?? null} name={name} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-ink">{name}</span>
        <span className="block text-xs text-ink-muted">
          <time dateTime={comment.createdAt}>{formatRelativeDate(comment.createdAt)}</time>
          {comment.isEdited && " · edited"}
        </span>
      </span>
    </>
  );

  return (
    <article className={deleting ? "opacity-50" : undefined}>
      <header className="flex items-center justify-between gap-3">
        {author ? (
          <Link href={`/authors/${author.username}`} className="focus-ring flex min-w-0 items-center gap-3 rounded-xl">
            {authorBlock}
          </Link>
        ) : (
          <div className="flex min-w-0 items-center gap-3">{authorBlock}</div>
        )}

        {mode !== "edit" && <CommentMenu items={menuItems} />}
      </header>

      {mode === "edit" ? (
        <div className="mt-3">
          <CommentForm
            initialValue={comment.content}
            onSubmit={handleEdit}
            onCancel={() => setMode("view")}
            submitLabel="Save"
            autoFocus
          />
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-line break-words font-serif text-[17px] leading-relaxed text-ink">
          {comment.content}
        </p>
      )}

      {error && <p className="mt-2 text-xs text-berry">{error}</p>}
      {notice && !error && <p className="mt-2 text-xs text-ink-muted">{notice}</p>}

      {!isReply && mode !== "edit" && (
        <div className="-ml-2.5 mt-3 flex flex-wrap items-center gap-1">
          {viewer && (
            <button type="button" className={actionClass} onClick={() => setMode(mode === "reply" ? "view" : "reply")}>
              Reply
            </button>
          )}
          {replyCount !== 0 && (
            <button
              type="button"
              onClick={toggleReplies}
              disabled={repliesLoading}
              className={`${actionClass} !text-leaf-deep`}
            >
              {repliesLoading
                ? "Loading…"
                : repliesOpen
                  ? "Hide replies"
                  : replyCount
                    ? `Show replies (${replyCount})`
                    : "Show replies"}
            </button>
          )}
        </div>
      )}

      {mode === "reply" && (
        <div className="mt-3">
          <CommentForm
            onSubmit={handleReply}
            onCancel={() => setMode("view")}
            submitLabel="Reply"
            placeholder={`Reply to ${name}…`}
            autoFocus
          />
        </div>
      )}

      {repliesOpen && replies && replies.length > 0 && (
        <ul className="mt-4 space-y-5 border-l-2 border-leaf/40 pl-4 sm:pl-5">
          {replies.map((reply) => (
            <li key={reply.id}>
              <CommentItem
                comment={reply}
                poemId={poemId}
                viewer={viewer}
                onUpdated={(u) => setReplies((prev) => prev?.map((r) => (r.id === u.id ? u : r)) ?? null)}
                onDeleted={(id) => {
                  setReplies((prev) => prev?.filter((r) => r.id !== id) ?? null);
                  onCountChange(-1);
                }}
                onCountChange={onCountChange}
              />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

/* ---------------- form ---------------- */

type FormProps = {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  initialValue?: string;
  submitLabel: string;
  placeholder?: string;
  autoFocus?: boolean;
};

function CommentForm({ onSubmit, onCancel, initialValue = "", submitLabel, placeholder, autoFocus }: FormProps) {
  const [value, setValue] = useState(initialValue);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = value.trim();
  const tooLong = value.length > COMMENT_MAX_LENGTH;
  const unchanged = initialValue !== "" && trimmed === initialValue.trim();
  const disabled = pending || !trimmed || tooLong || unchanged;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (disabled) return;
    setPending(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      if (!initialValue) setValue("");
    } catch (err) {
      setError(commentErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
    if (e.key === "Escape" && onCancel) onCancel();
  }

  const hint = error ?? (value.length > COMMENT_MAX_LENGTH * 0.8 ? `${value.length}/${COMMENT_MAX_LENGTH}` : null);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={3}
        aria-label={placeholder ?? submitLabel}
        className="block w-full resize-none rounded-2xl border border-[var(--glass-border)] bg-white/50 px-4 py-3 font-serif text-[17px] leading-relaxed text-ink shadow-[var(--glass-highlight)] placeholder:italic placeholder:text-ink-muted/70 focus:border-leaf-deep focus:outline-none focus:ring-2 focus:ring-leaf/40"
      />
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        {hint && (
          <span className={`mr-auto text-xs ${tooLong || error ? "text-berry" : "text-ink-muted"}`}>{hint}</span>
        )}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="focus-ring rounded-full px-4 py-2 text-sm text-ink-muted hover:bg-[var(--glass-hover)] hover:text-ink"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={disabled}
          className="focus-ring rounded-full bg-berry px-5 py-2 text-sm font-medium text-white shadow-[var(--glass-highlight)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Posting…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

/* ---------------- misc ---------------- */

function CommentsSkeleton() {
  return (
    <ul className="space-y-4" aria-hidden>
      {[0, 1, 2].map((i) => (
        <li key={i} className={`${cardClass} animate-pulse p-5`}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-leaf/30" />
            <div className="space-y-2">
              <div className="h-3 w-28 rounded bg-leaf/30" />
              <div className="h-2.5 w-16 rounded bg-leaf/20" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-leaf/20" />
            <div className="h-3 w-2/3 rounded bg-leaf/20" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.5 8.5 0 0 1-12.4 7.55L3 20.5l1.45-5.6A8.5 8.5 0 1 1 21 11.5Z" />
    </svg>
  );
}