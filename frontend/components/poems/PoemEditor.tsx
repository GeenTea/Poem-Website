"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import type { Poem, Tag } from "@/types/poem";
import {
  POEM_CONTENT_MAX_LENGTH,
  POEM_MAX_TAGS,
  POEM_TITLE_MAX_LENGTH,
  poemErrorMessage,
  poemsApi,
  type PoemInput,
} from "@/lib/poems-client-api";
import { cn, formatRelativeDate } from "@/lib/utils";
import { TagPicker } from "@/components/poems/editor/TagPicker";
import { DraftSwitch } from "@/components/poems/editor/DraftSwitch";
import {
  clearLocalDraft,
  readLocalDraft,
  writeLocalDraft,
  type LocalDraft,
} from "@/components/poems/editor/local-draft";

type Props =
  | {
      mode: "create";
      /** Все теги — чипы для выбора */
      allTags: Tag[];
      /** Имя для превью: «by …» */
      authorName: string;
    }
  | {
      mode: "edit";
      allTags: Tag[];
      authorName: string;
      /** Редактируемый стих (только свой) */
      poem: Poem;
    };

const AUTOSAVE_DELAY_MS = 800;

const card = "auth-card rounded-[28px] bg-[var(--glass)]";
const label = "text-xs font-medium uppercase tracking-[0.18em] text-ink-muted";

/**
 * Редактор стиха (создание и редактирование).
 *
 * Новый стих автосохраняется в localStorage. Чтобы не было расхождения гидратации
 * (на сервере localStorage нет), первый рендер всегда пустой, а сохранённый черновик
 * читается уже после монтирования — и предлагается баннером «Restore / Discard».
 */
export function PoemEditor(props: Props) {
  const { mode, allTags, authorName } = props;
  const poem = props.mode === "edit" ? props.poem : null;
  const router = useRouter();

  const isHidden = poem?.status === "ARCHIVED";
  const hiddenByAuthor = poem ? poem.hiddenById === poem.author.id : false;

  // Начальные значения: в режиме редактирования — из стиха, иначе пусто
  const [initial] = useState(() => ({
    title: poem?.title ?? "",
    content: poem?.text ?? "",
    tagSlugs: poem?.tags.map((t) => t.slug) ?? [],
    keepDraft: poem ? poem.status === "DRAFT" : true,
  }));

  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [tagSlugs, setTagSlugs] = useState<string[]>(initial.tagSlugs);
  const [keepDraft, setKeepDraft] = useState(initial.keepDraft);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Автосохранение (только create)
  const [hasEdited, setHasEdited] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [restoreOffer, setRestoreOffer] = useState<LocalDraft | null>(null);
  const [, setTick] = useState(0); // перерисовка «autosaved 2 minutes ago»

  const formRef = useRef<HTMLFormElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // ---------- Восстановление черновика из localStorage (после монтирования) ----------
  useEffect(() => {
    if (mode !== "create") return;
    // setState в колбэке таймера, а не синхронно в эффекте (правило react-hooks/set-state-in-effect)
    const id = window.setTimeout(() => setRestoreOffer(readLocalDraft()), 0);
    return () => window.clearTimeout(id);
  }, [mode]);

  // ---------- Автосохранение с задержкой ----------
  useEffect(() => {
    // Пока висит предложение восстановить — не перезаписываем старый черновик
    if (mode !== "create" || !hasEdited || restoreOffer || saving) return;
    const id = window.setTimeout(() => {
      if (!title.trim() && !content.trim()) {
        clearLocalDraft();
        setSavedAt(null);
        return;
      }
      const at = new Date().toISOString();
      if (writeLocalDraft({ title, content, tagSlugs, keepDraft, savedAt: at })) setSavedAt(at);
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [mode, hasEdited, restoreOffer, saving, title, content, tagSlugs, keepDraft]);

  // Раз в 30 секунд обновляем относительное время автосохранения
  useEffect(() => {
    if (!savedAt) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, [savedAt]);

  // ---------- Высота поля стиха растёт вместе с текстом ----------
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [content, preview]);

  // ---------- Состояние ----------
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  const valid =
    trimmedTitle.length > 0 &&
    trimmedContent.length > 0 &&
    trimmedTitle.length <= POEM_TITLE_MAX_LENGTH &&
    trimmedContent.length <= POEM_CONTENT_MAX_LENGTH &&
    tagSlugs.length <= POEM_MAX_TAGS;

  const dirty =
    title !== initial.title ||
    content !== initial.content ||
    keepDraft !== initial.keepDraft ||
    tagSlugs.join(",") !== initial.tagSlugs.join(",");

  // Предупреждение при уходе со страницы: в edit — есть несохранённые правки,
  // в create — пока черновик ещё не попал в localStorage (или ждёт решения в баннере)
  const unsafeToLeave =
    !saving &&
    (mode === "edit"
      ? dirty
      : hasEdited && (trimmedTitle || trimmedContent) !== "" && (!savedAt || !!restoreOffer));

  useEffect(() => {
    if (!unsafeToLeave) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [unsafeToLeave]);

  const lineCount = content === "" ? 0 : content.split("\n").length;
  const lines = `${lineCount} ${lineCount === 1 ? "line" : "lines"}`;

  let saveState: string;
  if (mode === "edit") {
    saveState = dirty ? "Unsaved changes" : "All changes saved";
  } else if (savedAt) {
    saveState = `Autosaved ${relativeOrJustNow(savedAt)}`;
  } else {
    saveState = "Not saved yet";
  }

  let primaryLabel: string;
  if (keepDraft && !isHidden) primaryLabel = "Save draft";
  else if (poem && poem.status !== "DRAFT") primaryLabel = "Save changes";
  else primaryLabel = "Publish";

  const selectedTags = allTags.filter((t) => tagSlugs.includes(t.slug));

  // ---------- Обработчики ----------
  function edited() {
    setHasEdited(true);
    setError(null);
  }

  function toggleTag(slug: string) {
    edited();
    setTagSlugs((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length >= POEM_MAX_TAGS
          ? prev
          : [...prev, slug],
    );
  }

  function restore() {
    if (!restoreOffer) return;
    const known = new Set(allTags.map((t) => t.slug));
    setTitle(restoreOffer.title.slice(0, POEM_TITLE_MAX_LENGTH));
    setContent(restoreOffer.content.slice(0, POEM_CONTENT_MAX_LENGTH));
    setTagSlugs(restoreOffer.tagSlugs.filter((s) => known.has(s)).slice(0, POEM_MAX_TAGS));
    setKeepDraft(restoreOffer.keepDraft);
    setSavedAt(restoreOffer.savedAt);
    setHasEdited(true);
    setRestoreOffer(null);
  }

  function discard() {
    clearLocalDraft();
    setRestoreOffer(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setError(null);

    const status: PoemInput["status"] = keepDraft ? "DRAFT" : "PUBLISHED";
    try {
      let id: string;
      if (poem) {
        // Скрытому стиху статус менять нельзя (бэкенд ответит 400) — не отправляем его
        const input: Partial<PoemInput> = {
          title: trimmedTitle,
          content: trimmedContent,
          tagSlugs,
          ...(isHidden ? {} : { status }),
        };
        id = (await poemsApi.update(poem.id, input)).id;
      } else {
        id = (await poemsApi.create({ title: trimmedTitle, content: trimmedContent, tagSlugs, status })).id;
        clearLocalDraft();
      }
      // saving остаётся true: кнопка заблокирована, пока идёт переход
      router.push(`/poems/${id}`);
      router.refresh();
    } catch (err) {
      setError(poemErrorMessage(err));
      setSaving(false);
    }
  }

  // Ctrl/Cmd + Enter — сохранить
  function handleTextKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  // Enter в заголовке не отправляет форму, а переводит к тексту
  function handleTitleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (e.metaKey || e.ctrlKey) formRef.current?.requestSubmit();
    else textRef.current?.focus();
  }

  // ---------- Разметка ----------
  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      {/* Шапка */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h1 className="font-serif text-4xl leading-tight text-ink sm:text-5xl">
          {mode === "create" ? "New poem" : "Edit poem"}
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            aria-pressed={preview}
            className="glass-pill focus-ring inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-ink"
          >
            {preview ? <PenIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            {preview ? (mode === "create" ? "Write" : "Edit") : "Preview"}
          </button>
          <button
            type="submit"
            disabled={!valid || saving}
            className="focus-ring inline-flex items-center gap-2 rounded-full bg-berry px-5 py-2 text-sm font-medium text-white shadow-[var(--glass-highlight)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SaveIcon className="h-4 w-4" />
            {saving ? "Saving…" : primaryLabel}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-right text-sm text-berry">
          {error}
        </p>
      )}

      {/* Предложение восстановить черновик из браузера */}
      {restoreOffer && (
        <div
          role="status"
          className={`${card} mt-6 flex flex-wrap items-center justify-between gap-3 px-5 py-4`}
        >
          <p className="text-sm text-ink">
            Restore unsaved draft
            {restoreOffer.title.trim() && (
              <>
                {" "}
                <span className="font-serif italic">“{restoreOffer.title.trim()}”</span>
              </>
            )}{" "}
            from {relativeOrJustNow(restoreOffer.savedAt)}?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={discard}
              className="focus-ring rounded-full px-4 py-1.5 text-sm text-ink-muted hover:bg-[var(--glass-hover)] hover:text-ink"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={restore}
              className="focus-ring rounded-full bg-berry px-4 py-1.5 text-sm font-medium text-white hover:brightness-110"
            >
              Restore
            </button>
          </div>
        </div>
      )}

      {/* Большая карточка: редактор или превью */}
      <section
        className={`${card} mt-6 flex min-h-[28rem] flex-col px-6 py-8 sm:px-10 sm:py-10`}
        aria-label={preview ? "Preview" : "Poem"}
      >
        {preview ? (
          <article className="flex-1">
            <h2 className="text-balance break-words font-serif text-4xl leading-tight text-ink sm:text-5xl">
              {trimmedTitle || <span className="text-ink-muted/60">Untitled</span>}
            </h2>
            <p className="mt-4 font-serif text-lg italic text-ink-muted">by {authorName}</p>
            <hr className="my-8 border-0 border-t border-leaf/40" />
            <div className="whitespace-pre-line break-words px-1 font-serif poem-text text-ink sm:px-2">
              {content.trim() ? content : <span className="italic text-ink-muted/60">Nothing written yet.</span>}
            </div>
            {selectedTags.length > 0 && (
              <ul className="mt-10 flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  // Как TagBadge, но не ссылка — чтобы из превью нельзя было уйти и потерять текст
                  <li
                    key={tag.slug}
                    className="flex h-9 min-w-[6.06rem] items-center justify-center rounded-4xl border border-leaf bg-cream px-3 text-xs text-leaf-deep"
                  >
                    {tag.name}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ) : (
          <div className="flex-1">
            <label htmlFor="poem-title" className="sr-only">
              Title
            </label>
            <input
              id="poem-title"
              value={title}
              onChange={(e) => {
                edited();
                setTitle(e.target.value);
              }}
              onKeyDown={handleTitleKeyDown}
              maxLength={POEM_TITLE_MAX_LENGTH}
              placeholder="Title"
              autoComplete="off"
              autoFocus={mode === "create"}
              className="block w-full bg-transparent font-serif text-3xl text-ink placeholder:text-ink-muted/50 focus:outline-none sm:text-4xl"
            />

            <label htmlFor="poem-text" className="sr-only">
              Poem text
            </label>
            <textarea
              id="poem-text"
              ref={textRef}
              value={content}
              onChange={(e) => {
                edited();
                setContent(e.target.value);
              }}
              onKeyDown={handleTextKeyDown}
              maxLength={POEM_CONTENT_MAX_LENGTH}
              placeholder={"Begin anywhere.\nThe line breaks are yours."}
              rows={10}
              aria-describedby="poem-meta"
              className="mt-8 block min-h-[20rem] w-full resize-none overflow-hidden bg-transparent font-serif poem-text text-ink placeholder:text-ink-muted/50 focus:outline-none"
            />
          </div>
        )}

        <p id="poem-meta" className={cn(label, "mt-6 text-[0.7rem]")} aria-live="polite">
          {lines} · {saveState}
        </p>
      </section>

      {/* Теги и видимость */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className={`${card} p-6`} aria-labelledby="tags-label">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="tags-label" className={label}>
              Tags
            </h2>
            <span className="text-xs tabular-nums text-ink-muted">
              {tagSlugs.length}/{POEM_MAX_TAGS}
            </span>
          </div>
          <TagPicker tags={allTags} selected={tagSlugs} max={POEM_MAX_TAGS} onToggle={toggleTag} />
        </section>

        <section className={`${card} p-6`} aria-labelledby="visibility-label">
          <h2 id="visibility-label" className={label}>
            Visibility
          </h2>
          <div className="mt-3">
            <DraftSwitch
              checked={keepDraft && !isHidden}
              disabled={isHidden}
              onChange={(value) => {
                edited();
                setKeepDraft(value);
              }}
              label="Keep as draft"
              description={
                isHidden
                  ? "Hidden — only you and moderators can see it."
                  : keepDraft
                    ? "Only you can see this. Nothing is shared yet."
                    : "Everyone will be able to read it."
              }
            />
          </div>
          {isHidden ? (
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              This poem is hidden by {hiddenByAuthor ? "you" : "a moderator"} — unhide it from the
              poem&apos;s ⋯ menu to change visibility.
            </p>
          ) : (
            <p className="mt-4 font-serif leading-relaxed text-ink-muted">
              Drafts stay in the nest as long as you need. Poems can be edited after publishing —
              readers see the newest version.
            </p>
          )}
        </section>
      </div>
    </form>
  );
}

export default PoemEditor;

/** «just now» вместо «now» для свежих отметок */
function relativeOrJustNow(iso: string) {
  const rel = formatRelativeDate(iso);
  return rel === "now" ? "just now" : rel;
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PenIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path strokeLinecap="round" d="m13.5 6.5 4 4" />
    </svg>
  );
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <path strokeLinejoin="round" d="M5 4h11l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4Z" />
      <path strokeLinejoin="round" d="M8 4v5h7V4M8 20v-6h8v6" />
    </svg>
  );
}
