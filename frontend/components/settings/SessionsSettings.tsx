"use client";

import { useEffect, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { sessionsApi, type ActiveSession } from "@/lib/sessions-api";
import { formatRelativeDate } from "@/lib/utils";
import { FormMessage, SectionHeader, linkButton, primaryButton } from "./ui";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** «Активные сеансы»: где выполнен вход, и выход на других устройствах */
export function SessionsSettings() {
  // null — ещё грузится
  const [sessions, setSessions] = useState<ActiveSession[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null); // id сессии или "others"
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // setState только внутри .then/.catch — не синхронно в теле эффекта
    sessionsApi
      .list()
      .then((list) => {
        if (!cancelled) setSessions(list);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setSessions([]);
          setError(err.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function signOut(id: string) {
    if (!sessions || busyId) return;
    const before = sessions;
    setBusyId(id);
    setError(null);
    setSuccess(null);
    // Оптимистично убираем строку сразу; при ошибке вернём список обратно
    setSessions(sessions.filter((s) => s.id !== id));
    try {
      await sessionsApi.revoke(id);
      setSuccess("Signed out of that device.");
    } catch (err) {
      setSessions(before);
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function signOutOthers() {
    if (!sessions || busyId) return;
    const before = sessions;
    setBusyId("others");
    setError(null);
    setSuccess(null);
    setSessions(sessions.filter((s) => s.current));
    try {
      const { revoked } = await sessionsApi.revokeOthers();
      setSuccess(`Signed out of ${revoked} other ${revoked === 1 ? "device" : "devices"}.`);
    } catch (err) {
      setSessions(before);
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const hasOthers = sessions?.some((s) => !s.current) ?? false;

  return (
    <section>
      <SectionHeader
        title="Active sessions"
        description="Devices where you're signed in. If you don't recognise one, sign out of it and change your password."
      />

      {sessions === null ? (
        <p className="text-sm text-ink-muted">Loading sessions…</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-ink-muted">No active sessions.</p>
      ) : (
        <ul className="divide-y divide-[var(--glass-border)] rounded-2xl border border-[var(--glass-border)]">
          {sessions.map((s) => {
            const Icon = s.kind === "mobile" ? Smartphone : Monitor;
            return (
              <li key={s.id} className="flex items-center gap-4 px-4 py-3">
                <Icon className="size-6 shrink-0 text-ink-muted" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
                    {s.device}
                    {s.current && (
                      <span className="rounded-full bg-leaf/20 px-2 py-0.5 text-xs font-medium text-leaf-deep">
                        This device
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {s.current ? "Active now" : `Active ${formatRelativeDate(s.lastUsedAt)}`}
                    {" · "}Signed in {dateFormat.format(new Date(s.createdAt))}
                    {s.ip && <> · {s.ip}</>}
                  </p>
                </div>
                {!s.current && (
                  <button
                    type="button"
                    onClick={() => signOut(s.id)}
                    disabled={busyId !== null}
                    className={linkButton}
                  >
                    Sign out
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 space-y-4">
        <FormMessage error={error} success={success} />
        {hasOthers && (
          <button type="button" onClick={signOutOthers} disabled={busyId !== null} className={primaryButton}>
            {busyId === "others" ? "Signing out…" : "Sign out of all other devices"}
          </button>
        )}
      </div>
    </section>
  );
}
