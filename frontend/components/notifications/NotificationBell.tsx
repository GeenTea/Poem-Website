"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BellIcon } from "@/components/ui/icons";
import { NOTIFICATIONS_CHANGED_EVENT, notificationsApi } from "@/lib/notifications-api";

const POLL_INTERVAL_MS = 30_000;

/** Колокольчик в хедере с числом непрочитанных. Обновляется опросом. */
export function NotificationBell() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    notificationsApi
      .unreadCount()
      .then(setCount)
      .catch(() => {}); // нет сети / сессия истекла — просто оставляем старое число
  }, []);

  useEffect(() => {
    refresh();

    // Опрашиваем только видимую вкладку, а при возвращении на неё — сразу обновляем
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_INTERVAL_MS);
    function onVisible() {
      if (document.visibilityState === "visible") refresh();
    }

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    };
  }, [refresh]);

  const label = count > 0 ? `Notifications (${count} unread)` : "Notifications";

  return (
    <Link
      href="/notifications"
      aria-label={label}
      title={label}
      className="glass-pill focus-ring relative grid size-10 place-items-center rounded-full text-[var(--ink)]"
    >
      <BellIcon className="size-[18px]" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[var(--accent)] px-1 text-[11px] font-semibold leading-5 text-[var(--accent-ink)]">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
