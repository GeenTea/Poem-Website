// Клиентский API «Активных сеансов» (браузер). Токен добавляет прокси app/api/[...path].

export interface ActiveSession {
  id: string;
  device: string; // «Chrome on Windows» — бэкенд разбирает User-Agent
  kind: "mobile" | "desktop";
  ip: string | null;
  createdAt: string;
  lastUsedAt: string;
  current: boolean; // сессия этого браузера
}

async function request<T>(method: "GET" | "DELETE", path = ""): Promise<T> {
  const res = await fetch(`/api/auth/sessions${path}`, { method, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(data.message) ? data.message[0] : data.message;
    throw new Error(message || "Something went wrong. Please try again.");
  }
  return data as T;
}

export const sessionsApi = {
  list: () => request<ActiveSession[]>("GET"),
  /** Выйти на одном устройстве (не на текущем — для него обычный выход) */
  revoke: (id: string) => request<{ ok: true }>("DELETE", `/${encodeURIComponent(id)}`),
  /** Выйти везде, кроме этого браузера */
  revokeOthers: () => request<{ revoked: number }>("DELETE"),
};
