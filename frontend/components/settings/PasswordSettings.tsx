"use client";

import { useState, type FormEvent } from "react";
import { PASSWORD_MAX, PASSWORD_MIN, accountApi, errorText } from "@/lib/account-api";
import { Field, FormMessage, PasswordInput, SectionHeader, primaryButton } from "./ui";

/** Смена пароля: текущий пароль, затем новый два раза */
export function PasswordSettings() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const tooShort = next.length > 0 && next.length < PASSWORD_MIN;
  const sameAsCurrent = next.length > 0 && next === current;
  const mismatch = confirm.length > 0 && confirm !== next;
  const valid =
    current.length > 0 &&
    next.length >= PASSWORD_MIN &&
    next.length <= PASSWORD_MAX &&
    !sameAsCurrent &&
    next === confirm;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valid || pending) return;
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      await accountApi.changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setSuccess("Password changed. You've been signed out on your other devices.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <SectionHeader
        title="Password"
        description="Enter your current password to confirm it's you, then choose a new one."
      />

      <div className="space-y-4">
        <Field label="Current password" htmlFor="current-password">
          <PasswordInput
            id="current-password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            maxLength={PASSWORD_MAX}
          />
        </Field>

        <Field
          label="New password"
          htmlFor="new-password"
          hint={`At least ${PASSWORD_MIN} characters.`}
          error={
            tooShort
              ? `At least ${PASSWORD_MIN} characters.`
              : sameAsCurrent
                ? "The new password must be different from the current one."
                : null
          }
        >
          <PasswordInput
            id="new-password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            maxLength={PASSWORD_MAX}
          />
        </Field>

        <Field
          label="Repeat new password"
          htmlFor="confirm-password"
          error={mismatch ? "Passwords don't match." : null}
        >
          <PasswordInput
            id="confirm-password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            maxLength={PASSWORD_MAX}
          />
        </Field>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        <div className="mr-auto">
          <FormMessage error={error} success={success} />
        </div>
        <button type="submit" disabled={!valid || pending} className={primaryButton}>
          {pending ? "Saving…" : "Change password"}
        </button>
      </div>
    </form>
  );
}
