"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { EyeClosed, EyeIcon } from "lucide-react";

// Общие кусочки вкладок настроек — чтобы все три формы выглядели одинаково.

export const inputClass =
  "block w-full rounded-2xl border border-[var(--glass-border)] bg-input-bg px-4 py-2.5 text-ink placeholder:text-ink-muted/70 focus:border-leaf-deep focus:outline-none focus:ring-2 focus:ring-leaf/40 disabled:opacity-60";

export const primaryButton =
  "focus-ring rounded-full bg-berry px-6 py-2.5 text-sm font-medium text-white shadow-[var(--glass-highlight)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

export const linkButton = "text-sm text-ink-muted hover:text-ink disabled:opacity-50";

/** Подпись + поле + подсказка/ошибка под ним */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-berry">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/** Поле пароля с кнопкой «показать/скрыть» */
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className={`${inputClass} pr-11`} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
      >
        {show ? <EyeClosed className="size-5" /> : <EyeIcon className="size-5" />}
      </button>
    </div>
  );
}

/** Сообщение об успехе или ошибке формы */
export function FormMessage({ error, success }: { error?: string | null; success?: string | null }) {
  if (error) return <p role="alert" className="text-sm text-berry">{error}</p>;
  if (success) return <p role="status" className="text-sm text-leaf-deep">{success}</p>;
  return null;
}

/** Заголовок раздела внутри вкладки */
export function SectionHeader({ title, description }: { title: string; description: ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="font-serif text-2xl text-ink">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
    </div>
  );
}
