// Клиентский API уведомлений (браузер). Токен добавляет прокси app/api/[...path].
import type { NotificationPage } from "@/types/notification";

export const NOTIFICATIONS_PAGE_SIZE = 20;

/** Событие, по которому колокольчик в хедере перезапрашивает счётчик. */
export const NOTIFICATIONS_CHANGED_EVENT = "notifications:changed";

export function emitNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/notifications${path}`, { cache: "no-store", ...init });
  if (!res.ok) throw new Error(`Notifications request failed with status ${res.status}`);
  return res.json() as Promise<T>;
}

export const notificationsApi = {
  list: (page: number) =>
    request<NotificationPage>(`?page=${page}&limit=${NOTIFICATIONS_PAGE_SIZE}`),
  unreadCount: () => request<{ count: number }>("/unread-count").then((r) => r.count),
  markRead: (id: string) =>
    request<{ ok: true }>(`/${encodeURIComponent(id)}/read`, { method: "PATCH" }),
  markAllRead: () => request<{ updated: number }>("/read-all", { method: "PATCH" }),
};
