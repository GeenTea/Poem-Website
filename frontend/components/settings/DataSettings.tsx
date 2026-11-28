"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { DELETE_CONFIRM_WORD, EXPORT_URL, accountApi, errorText, PASSWORD_MAX } from "@/lib/account-api";
import { Field, PasswordInput, SectionHeader, inputClass, primaryButton } from "./ui";

// Вкладка «Your data»: скачать все стихи и удалить аккаунт.
export function DataSettings() {
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="divide-y divide-[var(--glass-border)]">
      <div className="pb-8">
        <SectionHeader
          title="Download your poems"
          description="All your poems, including drafts and hidden ones, in one Markdown file."
        />
        {/* Обычная ссылка: браузер сам скачает файл (имя берёт из заголовка Content-Disposition) */}
        <a href={EXPORT_URL} download className={`${primaryButton} inline-flex items-center gap-2`}>
          <Download className="size-4" aria-hidden />
          Download poems.md
        </a>
      </div>

      <div className="pt-8">
        {/* «Опасная зона» — ягодная рамка, чтобы сразу было видно: действие необратимое */}
        <div className="rounded-[24px] border border-berry/60 p-6">
          <h2 className="font-serif text-2xl text-berry">Delete account</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            This permanently deletes your account and everything in it: your poems (including drafts and hidden
            ones), comments, likes, follows, notifications, reports and your profile picture. You will be signed
            out on all devices. <strong className="text-ink">This can&apos;t be undone.</strong>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Want to keep your poems? Download them first.
          </p>
          <button
            type="button"
            onClick={() => setDeleting(true)}
            className="focus-ring mt-5 rounded-full border border-berry px-6 py-2.5 text-sm font-medium text-berry transition hover:bg-berry hover:text-white"
          >
            Delete account
          </button>
        </div>
      </div>

      {/* Окно рендерим только пока оно открыто — так поля каждый раз начинаются с чистого листа */}
      {deleting && <DeleteAccountDialog onClose={() => setDeleting(false)} />}
    </div>
  );
}

/** Модальное окно подтверждения: пароль + слово DELETE. Тот же подход, что в ReportDialog */
function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [password, setPassword] = useState("");
  const [word, setWord] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // showModal() — окно поверх страницы, Escape закрывает, фокус не уходит наружу
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const disabled = pending || !password || word !== DELETE_CONFIRM_WORD;

  function close() {
    if (!pending) dialogRef.current?.close();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (disabled) return;
    setPending(true);
    setError(null);
    try {
      await accountApi.deleteAccount(password);
      // Аккаунта нет, cookie стёрты → на главную гостем; refresh перерисует серверные компоненты (шапку)
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(errorText(err));
      setPending(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="delete-account-title"
      onClose={onClose}
      onCancel={(e) => pending && e.preventDefault()}
      onClick={(e) => e.target === e.currentTarget && close()}
      className="modal m-auto w-[calc(100%-2rem)] max-w-md rounded-[24px] bg-transparent p-0 text-ink"
    >
      <form onSubmit={handleSubmit} className="glass-panel space-y-4 rounded-[24px] p-6 sm:p-7">
        <div>
          <h2 id="delete-account-title" className="font-serif text-2xl text-ink">
            Delete your account?
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            All your poems, comments and likes will be gone forever. Enter your password to confirm.
          </p>
        </div>

        <Field label="Password" htmlFor="delete-password">
          <PasswordInput
            id="delete-password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={PASSWORD_MAX}
            autoFocus
          />
        </Field>

        <Field label={`Type ${DELETE_CONFIRM_WORD} to confirm`} htmlFor="delete-confirm">
          <input
            id="delete-confirm"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={DELETE_CONFIRM_WORD}
            className={inputClass}
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-berry">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={close}
            disabled={pending}
            className="focus-ring rounded-full px-4 py-2 text-sm text-ink-muted hover:bg-[var(--glass-hover)] hover:text-ink disabled:opacity-50"
          >
            Cancel
          </button>
          <button type="submit" disabled={disabled} className={primaryButton}>
            {pending ? "Deleting…" : "Delete account"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
