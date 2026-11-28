"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

export const CODE_LENGTH = 6;

/** Пустой код: 6 пустых клеток */
export const emptyCode = () => Array<string>(CODE_LENGTH).fill("");

type Props = {
  /** Цифры по клеткам, "" — пустая клетка */
  value: string[];
  onChange: (digits: string[]) => void;
  /** Вызывается, когда заполнены все 6 клеток — можно сразу проверять */
  onComplete?: (code: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
};

/**
 * Поле для 6-значного кода из письма: 6 клеток, курсор сам переходит дальше,
 * Backspace возвращает назад, код можно вставить целиком (Ctrl+V в любую клетку),
 * а телефон может подставить его из письма сам (autoComplete="one-time-code").
 */
export function CodeInput({ value, onChange, onComplete, disabled, hasError, autoFocus }: Props) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  // Записать цифры начиная с клетки index; когда заполнены все — onComplete
  function fill(index: number, text: string) {
    const clean = text.replace(/\D/g, "").slice(0, CODE_LENGTH - index);
    if (!clean) return;
    const next = [...value];
    for (let i = 0; i < clean.length; i++) next[index + i] = clean[i];
    onChange(next);

    inputs.current[Math.min(index + clean.length, CODE_LENGTH - 1)]?.focus();
    if (next.every(Boolean)) onComplete?.(next.join(""));
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...value];
      if (next[index]) {
        next[index] = "";
      } else if (index > 0) {
        next[index - 1] = "";
        inputs.current[index - 1]?.focus();
      }
      onChange(next);
    }
    if (e.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function handlePaste(index: number, e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    fill(index, e.clipboardData.getData("text"));
  }

  return (
    <fieldset className="flex justify-center gap-2 sm:gap-3">
      <legend className="sr-only">6-digit code</legend>
      {value.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputs.current[i] = el;
          }}
          value={digit}
          onChange={(e) => fill(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && i === 0}
          maxLength={CODE_LENGTH}
          aria-label={`Digit ${i + 1}`}
          disabled={disabled}
          className={`size-12 rounded-xl border bg-input-bg text-center font-mono text-2xl text-ink focus:outline-none focus:ring-2 sm:size-14 ${
            hasError
              ? "border-[var(--berry)] focus:ring-berry/30"
              : "border-hairline focus:border-leaf-deep focus:ring-leaf/40"
          }`}
        />
      ))}
    </fieldset>
  );
}
