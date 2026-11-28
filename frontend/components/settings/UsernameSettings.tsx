"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { USERNAME_PATTERN, accountApi, errorText } from "@/lib/account-api";
import { Field, FormMessage, SectionHeader, inputClass, primaryButton } from "./ui";

/** Смена username. Хранится в нижнем регистре — приводим так же, как бэкенд */
export function UsernameSettings({ username }: { username: string }) {
  const router = useRouter();
  const [value, setValue] = useState(username);
  const [current, setCurrent] = useState(username);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const normalized = value.trim().toLowerCase();
  const changed = normalized !== current;
  const valid = USERNAME_PATTERN.test(normalized);
  const showRuleError = value.length > 0 && changed && !valid;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!changed || !valid || pending) return;
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const user = await accountApi.changeUsername(normalized);
      setCurrent(user.username);
      setValue(user.username);
      setSuccess(`Your username is now @${user.username}.`);
      router.refresh(); // шапка и ссылки на профиль — с новым username
    } catch (err) {
      setError(errorText(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <SectionHeader
        title="Username"
        description={
          <>
            Your username is part of your profile link:{" "}
            <span className="font-mono text-ink">/authors/{normalized || current}</span>. Old links to your profile will
            stop working after the change.
          </>
        }
      />

      <Field
        label="Username"
        htmlFor="username"
        hint='3–20 characters: latin letters, digits, "_" and ".".'
        error={showRuleError ? 'Use 3–20 characters: latin letters, digits, "_" and ".".' : null}
      >
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted">@</span>
          <input
            id="username"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={20}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className={`${inputClass} pl-8`}
          />
        </div>
      </Field>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        <div className="mr-auto">
          <FormMessage error={error} success={success} />
        </div>
        <button type="submit" disabled={!changed || !valid || pending} className={primaryButton}>
          {pending ? "Saving…" : "Change username"}
        </button>
      </div>
    </form>
  );
}
