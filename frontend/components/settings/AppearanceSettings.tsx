"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import type { PoemSize, Theme } from "@/lib/preferences";
import { setPoemSize, setTheme } from "@/app/settings/actions";
import { FormMessage, SectionHeader } from "@/components/settings/ui";

// Вкладка «Appearance»: тема и размер текста стихов. Текущие значения приходят со страницы
// (сервер прочитал cookie). Выбор применяется сразу: сначала меняем атрибут на <html>
// (оптимистично, без ожидания сервера), потом Server Function сохраняет cookie.
// Значения перечислены здесь, а не импортированы из lib/preferences: тот файл использует
// next/headers и может работать только на сервере (отсюда берём лишь типы).

const THEME_OPTIONS: { value: Theme; label: string; hint: string }[] = [
  { value: "light", label: "Light", hint: "Warm cream paper" },
  { value: "dark", label: "Dark", hint: "Calm night reading" },
];

const SIZE_OPTIONS: { value: PoemSize; label: string; name: string }[] = [
  { value: "s", label: "S", name: "Small" },
  { value: "m", label: "M", name: "Medium" },
  { value: "l", label: "L", name: "Large" },
];

// Цвета мини-превью намеренно «зашиты»: карточка показывает тему, а не текущую палитру
const SWATCH: Record<Theme, { bg: string; card: string; line: string; muted: string; accent: string }> = {
  light: { bg: "#fff7eb", card: "#f9f0e0", line: "#2f3122", muted: "#5f6349", accent: "#cc3a63" },
  dark: { bg: "#1d1b16", card: "#2a271f", line: "#efe7d6", muted: "#b4ab97", accent: "#e0577d" },
};

const SAMPLE = `The kettle hums a song it learned from rain,
the window keeps the colour of the street —
and every line I almost said again
waits on the sill, unfinished, small and sweet.`;

/** Меняет атрибут на <html> — CSS сразу подхватывает новую тему/размер */
function setHtmlAttribute(name: "data-theme" | "data-poem-size", value: string) {
  document.documentElement.setAttribute(name, value);
}

export function AppearanceSettings({ theme, poemSize }: { theme: Theme; poemSize: PoemSize }) {
  // Локальное состояние — чтобы выбор отображался мгновенно (оптимистичный интерфейс)
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [currentSize, setCurrentSize] = useState(poemSize);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function chooseTheme(next: Theme) {
    if (next === currentTheme) return;
    const previous = currentTheme;
    setCurrentTheme(next);
    setError(null);
    setHtmlAttribute("data-theme", next); // сразу перекрасить страницу
    startTransition(async () => {
      try {
        const { ok } = await setTheme(next);
        if (!ok) throw new Error();
      } catch {
        // Не сохранилось — возвращаем как было
        setCurrentTheme(previous);
        setHtmlAttribute("data-theme", previous);
        setError("Couldn't save the theme. Please try again.");
      }
    });
  }

  function chooseSize(next: PoemSize) {
    if (next === currentSize) return;
    const previous = currentSize;
    setCurrentSize(next);
    setError(null);
    setHtmlAttribute("data-poem-size", next);
    startTransition(async () => {
      try {
        const { ok } = await setPoemSize(next);
        if (!ok) throw new Error();
      } catch {
        setCurrentSize(previous);
        setHtmlAttribute("data-poem-size", previous);
        setError("Couldn't save the text size. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-10">
      {/* ---------- Тема ---------- */}
      <div>
        <SectionHeader title="Theme" description="Choose how Poem Nest looks on this device." />

        <div role="radiogroup" aria-label="Theme" className="grid gap-4 sm:grid-cols-2">
          {THEME_OPTIONS.map((option) => {
            const selected = option.value === currentTheme;
            const c = SWATCH[option.value];
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => chooseTheme(option.value)}
                className={`focus-ring group rounded-2xl border p-3 text-left transition ${
                  selected
                    ? "border-berry bg-surface-strong ring-2 ring-berry/30"
                    : "border-[var(--glass-border)] bg-surface hover:border-[var(--glass-border-strong)]"
                }`}
              >
                {/* Мини-превью: фон страницы, карточка со «строками» стиха и кнопкой */}
                <span
                  aria-hidden
                  className="block overflow-hidden rounded-xl border border-[var(--glass-border)] p-3"
                  style={{ background: c.bg }}
                >
                  <span className="block rounded-lg p-3" style={{ background: c.card }}>
                    <span className="block h-2 w-1/2 rounded-full" style={{ background: c.line }} />
                    <span className="mt-2 block h-1.5 w-4/5 rounded-full opacity-70" style={{ background: c.muted }} />
                    <span className="mt-1.5 block h-1.5 w-3/5 rounded-full opacity-70" style={{ background: c.muted }} />
                    <span className="mt-3 block h-3 w-10 rounded-full" style={{ background: c.accent }} />
                  </span>
                </span>

                <span className="mt-3 flex items-center justify-between gap-2 px-1">
                  <span>
                    <span className="block text-sm font-medium text-ink">{option.label}</span>
                    <span className="block text-xs text-ink-muted">{option.hint}</span>
                  </span>
                  <span
                    className={`grid size-5 place-items-center rounded-full border ${
                      selected ? "border-berry bg-berry text-white" : "border-[var(--glass-border-strong)]"
                    }`}
                  >
                    {selected && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- Размер текста стихов ---------- */}
      <div>
        <SectionHeader
          title="Poem text size"
          description="Changes the size of poem text only — on poem pages, in the feed and in the editor."
        />

        <div
          role="radiogroup"
          aria-label="Poem text size"
          className="inline-flex rounded-full border border-[var(--glass-border)] bg-surface p-1"
        >
          {SIZE_OPTIONS.map((option) => {
            const selected = option.value === currentSize;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={option.name}
                title={option.name}
                onClick={() => chooseSize(option.value)}
                className={`focus-ring min-w-14 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  selected ? "bg-berry text-white shadow-[var(--glass-highlight)]" : "text-ink-muted hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Живой образец: обёртка со своим data-poem-size задаёт размер именно для него */}
        <figure
          data-poem-size={currentSize}
          className="mt-5 rounded-2xl border border-[var(--glass-border)] bg-surface px-5 py-4"
        >
          <blockquote className="poem-text whitespace-pre-line font-serif text-ink">{SAMPLE}</blockquote>
          <figcaption className="mt-2 text-xs text-ink-muted">Sample</figcaption>
        </figure>
      </div>

      <FormMessage error={error} />
    </div>
  );
}
