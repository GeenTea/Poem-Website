"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CODE_LENGTH, CodeInput, emptyCode } from "@/components/auth/CodeInput";
import { accountApi, errorText } from "@/lib/account-api";
import { Field, FormMessage, SectionHeader, inputClass, linkButton, primaryButton } from "./ui";

type Step = "start" | "code" | "new";

const RESEND_SECONDS = 60; // как пауза между письмами на бэкенде

/**
 * Смена почты в 3 шага:
 *   1. код на текущую почту  2. ввод кода  3. новая почта (два раза — против опечаток)
 */
export function EmailSettings({ email }: { email: string }) {
  const [currentEmail, setCurrentEmail] = useState(email);
  const [step, setStep] = useState<Step>("start");
  const [sentTo, setSentTo] = useState("");
  const [digits, setDigits] = useState<string[]>(emptyCode);
  const [emailToken, setEmailToken] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Обратный отсчёт до повторной отправки (setState в колбэке таймера — так можно)
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  async function run(action: () => Promise<void>) {
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      await action();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setPending(false);
    }
  }

  const sendCode = () =>
    run(async () => {
      const res = await accountApi.sendEmailCode();
      setSentTo(res.email);
      setDigits(emptyCode());
      setStep("code");
      setCooldown(RESEND_SECONDS);
    });

  const verify = (code: string) =>
    run(async () => {
      const res = await accountApi.verifyEmailCode(code);
      setEmailToken(res.emailToken);
      setStep("new");
    });

  const trimmedNew = newEmail.trim();
  const mismatch = confirmEmail.length > 0 && confirmEmail.trim().toLowerCase() !== trimmedNew.toLowerCase();
  const same = trimmedNew.toLowerCase() === currentEmail.toLowerCase();
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedNew);
  const canChange = looksLikeEmail && !same && !mismatch && confirmEmail.length > 0;

  function submitNewEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canChange || pending) return;
    run(async () => {
      const res = await accountApi.changeEmail(emailToken, trimmedNew);
      setCurrentEmail(res.email);
      setStep("start");
      setNewEmail("");
      setConfirmEmail("");
      setEmailToken("");
      setSuccess(`Your email is now ${res.email}. You've been signed out on your other devices.`);
    });
  }

  function cancel() {
    setStep("start");
    setDigits(emptyCode());
    setEmailToken("");
    setNewEmail("");
    setConfirmEmail("");
    setError(null);
  }

  return (
    <div>
      <SectionHeader
        title="Email"
        description="To change your email, first confirm it's you with a code sent to your current address."
      />

      <div className="mb-6 rounded-2xl border border-[var(--glass-border)] bg-surface px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-muted">Current email</p>
        <p className="mt-1 text-ink">{currentEmail}</p>
      </div>

      {/* ---------- Шаг 1 ---------- */}
      {step === "start" && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="mr-auto">
            <FormMessage error={error} success={success} />
          </div>
          <button type="button" onClick={sendCode} disabled={pending} className={primaryButton}>
            {pending ? "Sending…" : "Send code"}
          </button>
        </div>
      )}

      {/* ---------- Шаг 2 ---------- */}
      {step === "code" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (digits.every(Boolean)) verify(digits.join(""));
          }}
          className="space-y-5"
        >
          <p className="text-sm text-ink-muted">
            We sent a 6-digit code to <b className="text-ink">{sentTo}</b>. It expires in 15 minutes.
          </p>
          <CodeInput
            value={digits}
            onChange={setDigits}
            onComplete={verify}
            disabled={pending}
            hasError={error !== null}
            autoFocus
          />
          <FormMessage error={error} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-4">
              <button type="button" onClick={cancel} className={linkButton}>
                Cancel
              </button>
              <button type="button" onClick={sendCode} disabled={cooldown > 0 || pending} className={linkButton}>
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>
            </div>
            <button
              type="submit"
              disabled={pending || digits.join("").length !== CODE_LENGTH}
              className={primaryButton}
            >
              {pending ? "Checking…" : "Verify code"}
            </button>
          </div>
        </form>
      )}

      {/* ---------- Шаг 3 ---------- */}
      {step === "new" && (
        <form onSubmit={submitNewEmail} className="space-y-4">
          <Field
            label="New email"
            htmlFor="new-email"
            error={trimmedNew && same ? "This is already your email." : null}
          >
            <input
              id="new-email"
              type="email"
              autoComplete="email"
              autoFocus
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              maxLength={254}
              className={inputClass}
            />
          </Field>
          <Field
            label="Repeat new email"
            htmlFor="confirm-email"
            hint="Typing it twice protects you from a typo — we won't send another code to check it."
            error={mismatch ? "Emails don't match." : null}
          >
            <input
              id="confirm-email"
              type="email"
              autoComplete="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              // Вставку не запрещаем, но смысл «повтора» — набрать адрес ещё раз
              maxLength={254}
              className={inputClass}
            />
          </Field>
          <FormMessage error={error} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={cancel} className={linkButton}>
              Cancel
            </button>
            <button type="submit" disabled={!canChange || pending} className={primaryButton}>
              {pending ? "Saving…" : "Change email"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
