// Клиентский API стихов (браузер). Все запросы идут через прокси app/api/[...path],
// который добавляет токен из httpOnly-cookie и после изменений сбрасывает кэш ленты.
import type { PoemDto } from "@/lib/poem-api";

/** Статус, который можно выбрать в редакторе. Скрытие — отдельными hide/unhide */
export type EditableStatus = "DRAFT" | "PUBLISHED";

export const POEM_TITLE_MAX_LENGTH = 200;
export const POEM_CONTENT_MAX_LENGTH = 20000;
export const POEM_MAX_TAGS = 5;

export interface PoemInput {
  title: string;
  content: string;
  tagSlugs: string[];
  status: EditableStatus;
}

export class PoemRequestError extends Error {
  constructor(public status: number) {
    super(`Poem request failed with status ${status}`);
  }
}

async function send<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/poems${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new PoemRequestError(res.status);
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const enc = encodeURIComponent;

export const poemsApi = {
  /** POST /poems — автор берётся из токена */
  create: (input: PoemInput) =>
    send<PoemDto>("", { method: "POST", body: JSON.stringify(input) }),

  /** PATCH /poems/:id — только автор */
  update: (id: string, input: Partial<PoemInput>) =>
    send<PoemDto>(`/${enc(id)}`, { method: "PATCH", body: JSON.stringify(input) }),

  /** PATCH /poems/:id/hide — автор, модератор, админ */
  hide: (id: string) => send<PoemDto>(`/${enc(id)}/hide`, { method: "PATCH" }),

  /** PATCH /poems/:id/unhide — модератор/админ; автор — если скрывал сам */
  unhide: (id: string) => send<PoemDto>(`/${enc(id)}/unhide`, { method: "PATCH" }),
};

export function poemErrorMessage(error: unknown) {
  if (error instanceof PoemRequestError) {
    if (error.status === 400) return "Please check the title, text and tags.";
    if (error.status === 401) return "Please sign in to continue.";
    if (error.status === 403) return "You don't have permission to do that.";
    if (error.status === 404) return "This poem no longer exists.";
    if (error.status === 409) return "This poem has already been changed. Refresh the page.";
  }
  return "Something went wrong. Please try again.";
}
