"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { REPORT_MAX_LENGTH, reportErrorMessage } from "@/lib/reports-api";

type Props = {
  /** Заголовок окна: "Report this note", "Report this poem" */
  title: string;
  /** Текст, на который жалуются (комментарий или начало стиха) — чтобы было понятно, о чём речь */
  quote: string;
  /** Имя автора */
  authorName: string;
  /** Отправка жалобы. Если бросит ошибку — покажем её внутри окна */
  onSubmit: (reason: string) => Promise<void>;
  /** Окно закрылось (Отмена, Escape, клик по фону) */
  onClose: () => void;
};

/**
 * Модальное окно жалобы (на комментарий или стих — что именно, решает родитель).
 *
 * Построено на встроенном <dialog>: showModal() сам кладёт окно поверх всей страницы,
 * закрывает его по Escape и не пускает фокус клавиатуры за пределы окна.
 * Затемнение и размытие фона — псевдоэлемент ::backdrop (стили в globals.css, класс .modal).
 *
 * Родитель рендерит компонент только пока окно открыто ({open && <ReportDialog/>}),
 * поэтому при каждом открытии поле и ошибка начинаются с чистого листа.
 */
export function ReportDialog({ title, quote, authorName, onSubmit, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Открываем окно сразу после появления компонента
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const trimmed = reason.trim();
  const disabled = pending || !trimmed;

  // Все способы закрыть окно идут через dialog.close() → событие "close" → onClose
  function close() {
    if (!pending) dialogRef.current?.close();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (disabled) return;
    setPending(true);
    setError(null);
    try {
      await onSubmit(trimmed); // при успехе родитель сам закроет окно
    } catch (err) {
      setError(reportErrorMessage(err));
      setPending(false);
    }
  }

  // Ctrl/Cmd + Enter — отправить, как в форме комментария
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="report-title"
      onClose={onClose}
      // Escape вызывает "cancel" — пока жалоба отправляется, закрывать не даём
      onCancel={(e) => pending && e.preventDefault()}
      // Клик по затемнённому фону: target — сам <dialog>, а не его содержимое
      onClick={(e) => e.target === e.currentTarget && close()}
      className="modal m-auto w-[calc(100%-2rem)] max-w-md rounded-[24px] bg-transparent p-0 text-ink"
    >
      <form onSubmit={handleSubmit} className="glass-panel rounded-[24px] p-6 sm:p-7">
        <h2 id="report-title" className="font-serif text-2xl text-ink">
          {title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
          Tell the moderators what&apos;s wrong. The author won&apos;t see who reported it.
        </p>

        {/* Цитата — чтобы было видно, на что именно жалоба */}
        <blockquote className="mt-4 rounded-2xl border-l-2 border-berry/50 bg-white/50 px-4 py-3">
          <p className="line-clamp-3 font-serif italic leading-relaxed text-ink">{quote}</p>
          <footer className="mt-1 text-xs text-ink-muted">— {authorName}</footer>
        </blockquote>

        <label htmlFor="report-reason" className="mt-5 block text-sm font-medium text-ink">
          Reason
        </label>
        <textarea
          id="report-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={REPORT_MAX_LENGTH}
          rows={4}
          autoFocus
          placeholder="Spam, insults, something else…"
          className="mt-1.5 block w-full resize-none rounded-2xl border border-[var(--glass-border)] bg-white/60 px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:italic placeholder:text-ink-muted/70 focus:border-leaf-deep focus:outline-none focus:ring-2 focus:ring-leaf/40"
        />

        <div className="mt-1.5 flex items-start justify-between gap-3 text-xs">
          <span className="text-berry" role="alert">{error}</span>
          <span className="shrink-0 tabular-nums text-ink-muted">
            {reason.length}/{REPORT_MAX_LENGTH}
          </span>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={close}
            disabled={pending}
            className="focus-ring rounded-full px-4 py-2 text-sm text-ink-muted hover:bg-[var(--glass-hover)] hover:text-ink disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={disabled}
            className="focus-ring rounded-full bg-berry px-5 py-2 text-sm font-medium text-white shadow-[var(--glass-highlight)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send report"}
          </button>
        </div>
      </form>
    </dialog>
  );
}