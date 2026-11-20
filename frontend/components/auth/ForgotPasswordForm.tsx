"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeClosed, EyeIcon } from "lucide-react";

type Step = "email" | "code" | "password";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60; // как пауза между письмами на бэкенде
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 128;

const inputClass =
  "w-full rounded-lg border border-[#2F31221A] bg-white/60 px-5 py-2.5 text-ink focus:border-leaf-deep focus:outline-none focus:ring-2 focus:ring-leaf/40";
const primaryButton =
  "mt-2 w-full rounded-2xl bg-[var(--berry)] py-4 text-[18px] font-bold text-amber-50 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

/** POST в наш API; возвращает JSON или бросает ошибку с текстом от сервера */
async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(data.message) ? data.message[0] : data.message;
    throw new Error(message || "Something went wrong. Please try again.");
  }
  return data as T;
}

/**
 * Восстановление пароля в одной карточке, три шага:
 *   email → код из 6 цифр (из письма) → новый пароль ×2 → вход и главная.
 */
export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Обратный отсчёт до повторной отправки кода
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  async function sendCode() {
    setPending(true);
    setError(null);
    try {
      await post("/api/auth/password/forgot", { email: email.trim() });
      setStep("code");
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function verifyCode(code: string) {
    setPending(true);
    setError(null);
    try {
      const data = await post<{ resetToken: string }>("/api/auth/password/verify", { email: email.trim(), code });
      setResetToken(data.resetToken);
      setStep("password");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function savePassword(password: string) {
    setPending(true);
    setError(null);
    try {
      // Свой route handler: ставит cookie с токенами — пользователь сразу вошёл
      await post("/api/auth/password/reset", { resetToken, password });
      router.replace("/");
      router.refresh(); // обновить шапку: теперь она для вошедшего
    } catch (err) {
      setError((err as Error).message);
      setPending(false);
    }
  }

  function startOver() {
    setStep("email");
    setResetToken("");
    setError(null);
  }

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] items-center justify-center px-4 py-10">
      <div className="auth-card w-full max-w-[37.5rem] rounded-2xl">
        <div className="flex flex-col gap-3 px-6 py-12 sm:px-14 sm:py-16">
          <StepDots step={step} />

          {step === "email" && (
            <EmailStep
              email={email}
              onEmail={setEmail}
              onSubmit={sendCode}
              pending={pending}
            />
          )}

          {step === "code" && (
            <CodeStep
              email={email}
              pending={pending}
              cooldown={cooldown}
              onVerify={verifyCode}
              onResend={sendCode}
              onChangeEmail={startOver}
              hasError={error !== null}
            />
          )}

          {step === "password" && <PasswordStep pending={pending} onSubmit={savePassword} />}

          {error && (
            <p role="alert" className="text-center text-[var(--berry)]">
              {error}
              {error.includes("expired") && step === "password" && (
                <>
                  {" "}
                  <button type="button" onClick={startOver} className="underline">
                    Start again
                  </button>
                </>
              )}
            </p>
          )}

          <Link href="/login" className="mt-4 text-center text-[15px] text-ink-muted hover:text-ink">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Шаг 1: email ---------------- */

function EmailStep({
  email,
  onEmail,
  onSubmit,
  pending,
}: {
  email: string;
  onEmail: (v: string) => void;
  onSubmit: () => void;
  pending: boolean;
}) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (email.trim()) onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h1 className="mb-2 text-center text-[36px] font-semibold sm:text-[42px]">Forgot password?</h1>
      <p className="mb-6 text-center text-ink-muted">
        Enter the email you signed up with and we&apos;ll send you a 6-digit code.
      </p>
      <label htmlFor="reset-email" className="text-[17px]">
        Email address
      </label>
      <input
        id="reset-email"
        type="email"
        autoComplete="email"
        required
        autoFocus
        value={email}
        onChange={(e) => onEmail(e.target.value)}
        placeholder="Enter your email"
        className={inputClass}
      />
      <button type="submit" disabled={pending || !email.trim()} className={primaryButton}>
        {pending ? "Sending…" : "Send code"}
      </button>
    </form>
  );
}

/* ---------------- Шаг 2: код из 6 цифр ---------------- */

function CodeStep({
  email,
  pending,
  cooldown,
  onVerify,
  onResend,
  onChangeEmail,
  hasError,
}: {
  email: string;
  pending: boolean;
  cooldown: number;
  onVerify: (code: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
  hasError: boolean;
}) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const code = digits.join("");

  // Записать цифры начиная с позиции index; когда все 6 на месте — сразу проверяем
  function fill(index: number, value: string) {
    const clean = value.replace(/\D/g, "").slice(0, CODE_LENGTH - index);
    if (!clean) return;
    const next = [...digits];
    for (let i = 0; i < clean.length; i++) next[index + i] = clean[i];
    setDigits(next);

    const last = Math.min(index + clean.length, CODE_LENGTH - 1);
    inputs.current[last]?.focus();
    if (next.every(Boolean)) onVerify(next.join(""));
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (next[index]) {
        next[index] = "";
      } else if (index > 0) {
        next[index - 1] = "";
        inputs.current[index - 1]?.focus();
      }
      setDigits(next);
    }
    if (e.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  // Вставка всего кода из буфера (Ctrl+V в любую клетку)
  function handlePaste(index: number, e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    fill(index, e.clipboardData.getData("text"));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (code.length === CODE_LENGTH) onVerify(code);
  }

  function resend() {
    setDigits(Array(CODE_LENGTH).fill(""));
    inputs.current[0]?.focus();
    onResend();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h1 className="mb-2 text-center text-[36px] font-semibold sm:text-[42px]">Check your email</h1>
      <p className="mb-6 text-center text-ink-muted">
        If an account exists for <b className="text-ink">{email.trim()}</b>, we sent a 6-digit code. It expires in 15
        minutes.
      </p>

      <fieldset className="flex justify-center gap-2 sm:gap-3">
        <legend className="sr-only">6-digit code</legend>
        {digits.map((digit, i) => (
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
            autoFocus={i === 0}
            maxLength={CODE_LENGTH}
            aria-label={`Digit ${i + 1}`}
            disabled={pending}
            className={`size-12 rounded-xl border bg-white/60 text-center font-mono text-2xl text-ink focus:outline-none focus:ring-2 sm:size-14 ${
              hasError ? "border-[var(--berry)] focus:ring-berry/30" : "border-[#2F31221A] focus:border-leaf-deep focus:ring-leaf/40"
            }`}
          />
        ))}
      </fieldset>

      <button type="submit" disabled={pending || code.length !== CODE_LENGTH} className={primaryButton}>
        {pending ? "Checking…" : "Verify code"}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[15px]">
        <button type="button" onClick={onChangeEmail} className="text-ink-muted hover:text-ink">
          Use another email
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || pending}
          className="text-[var(--berry)] disabled:text-ink-muted"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}

/* ---------------- Шаг 3: новый пароль ---------------- */

function PasswordStep({ pending, onSubmit }: { pending: boolean; onSubmit: (password: string) => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);

  const tooShort = password.length > 0 && password.length < PASSWORD_MIN;
  const mismatch = confirm.length > 0 && confirm !== password;
  const valid = password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX && password === confirm;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (valid) onSubmit(password);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h1 className="mb-2 text-center text-[36px] font-semibold sm:text-[42px]">New password</h1>
      <p className="mb-6 text-center text-ink-muted">
        Choose a new password. You&apos;ll be signed out on all other devices.
      </p>

      <label htmlFor="new-password" className="text-[17px]">
        New password
      </label>
      <div className="relative">
        <input
          id="new-password"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={PASSWORD_MAX}
          placeholder={`At least ${PASSWORD_MIN} characters`}
          className={`${inputClass} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
        >
          {show ? <EyeClosed /> : <EyeIcon />}
        </button>
      </div>
      {tooShort && <p className="-mt-1 text-sm text-[var(--berry)]">At least {PASSWORD_MIN} characters.</p>}

      <label htmlFor="confirm-password" className="text-[17px]">
        Repeat new password
      </label>
      <input
        id="confirm-password"
        type={show ? "text" : "password"}
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        maxLength={PASSWORD_MAX}
        placeholder="Repeat the password"
        className={inputClass}
      />
      {mismatch && <p className="-mt-1 text-sm text-[var(--berry)]">Passwords don&apos;t match.</p>}

      <button type="submit" disabled={pending || !valid} className={primaryButton}>
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}

/* ---------------- Индикатор шага ---------------- */

function StepDots({ step }: { step: Step }) {
  const steps: Step[] = ["email", "code", "password"];
  const current = steps.indexOf(step);
  return (
    <ol aria-label={`Step ${current + 1} of 3`} className="mb-4 flex justify-center gap-2">
      {steps.map((s, i) => (
        <li
          key={s}
          className={`h-1.5 rounded-full transition-all ${i === current ? "w-8 bg-[var(--berry)]" : i < current ? "w-4 bg-leaf-deep" : "w-4 bg-leaf/40"}`}
        />
      ))}
    </ol>
  );
}
