"use client";

import { useState } from "react";
import { ReportDialog } from "@/components/poems/ReportDialog";
import { reportsApi } from "@/lib/reports-api";

type Props = {
  poemId: string;
  title: string;
  /** Начало стиха — показываем в окне как цитату */
  excerpt: string;
  authorName: string;
};

/**
 * Кнопка «Report» под стихом. Страница показывает её только вошедшим и не автору.
 * После успешной жалобы кнопка становится «Reported» и больше не нажимается.
 */
export function ReportPoemButton({ poemId, title, excerpt, authorName }: Props) {
  const [open, setOpen] = useState(false);
  const [reported, setReported] = useState(false);

  // Вызывается окном. Ошибку не ловим — её покажет само окно.
  async function submit(reason: string) {
    await reportsApi.create("POEM", poemId, reason);
    setOpen(false);
    setReported(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={reported}
        title={reported ? "Your report has been sent to the moderators" : "Report this poem"}
        className="glass-pill focus-ring inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ink-muted hover:text-berry disabled:cursor-default disabled:opacity-70 disabled:hover:text-ink-muted"
      >
        <FlagIcon className="h-4 w-4" />
        {reported ? "Reported" : "Report"}
      </button>

      {open && (
        <ReportDialog
          title={`Report “${title}”`}
          quote={excerpt}
          authorName={authorName}
          onSubmit={submit}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21V4m0 0h11l-2 4 2 4H5" />
    </svg>
  );
}
