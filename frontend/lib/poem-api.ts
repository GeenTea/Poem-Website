// Серверные запросы к NestJS (Server Components). В браузере не используется —
// для изменений из браузера есть lib/poems-client-api.ts.
import type { PoemStatus } from "@/types/poem";
import type { AuthorProfile } from "@/types/user";

export interface PoemDto {
  id: string;
  title: string;
  content: string;
  status: PoemStatus;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  hiddenById: string | null;
  hiddenAt: string | null;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  tags?: Array<{ tag: { name: string; slug: string } }>;
  _count?: { likes: number; comments: number };
}

export interface TagDto{
  id: string;
  slug: string;
  name: string;
  _count: {poems: number}
}

export interface PoemFilters {
  tag?: string;
  q?: string;
  /** username автора */
  author?: string;
}

export class ApiError extends Error{
  constructor(
    public status: number,
    message: string,
  ){
    super(message)
  }
}

const API_URL = process.env.API_URL ?? "http://localhost:3001";

/**
 * Публичные данные кэшируются на 60 с и помечены тегом "poems".
 * Прокси app/api/[...path] сбрасывает этот тег после любого изменения стихов,
 * поэтому лента обновляется сразу, а не через минуту.
 */
async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 60, tags: ["poems"] } });
  if (!res.ok) {
    throw new ApiError(res.status, `API ${path} response ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Приватные данные (свои стихи, черновики) — с токеном и без кэша. */
async function requestWithToken<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new ApiError(res.status, `API ${path} response ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchPoems({tag, q, author} : PoemFilters = {}) {
  const params = new URLSearchParams();
  if(tag) params.set("tag", tag);
  if(q) params.set("q", q)
  if(author) params.set("author", author)

  const query = params.toString();

  return request<PoemDto[]>(`/poems/findall${query ? `?${query}` : "" }`);
}

/** Только опубликованный стих; иначе 404 */
export function fetchPoemById(id: string) {
  return request<PoemDto>(`/poems/findPoem/${encodeURIComponent(id)}`);
}

/** Черновик/скрытый стих: автору — любой статус, модератору — скрытый. Иначе 404 */
export function fetchPrivatePoem(id: string, token: string) {
  return requestWithToken<PoemDto>(`/poems/${encodeURIComponent(id)}/private`, token);
}

/** Все стихи текущего пользователя любого статуса */
export function fetchMyPoems(token: string) {
  return requestWithToken<PoemDto[]>("/poems/mine", token);
}

export function fetchTags(){
  return request<TagDto[]>("/tags")
}

/** Публичный профиль автора. Без кэша: число подписчиков меняется после каждой подписки */
export async function fetchAuthorProfile(username: string) {
  const path = `/users/${encodeURIComponent(username)}/profile`;
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new ApiError(res.status, `API ${path} response ${res.status}`);
  return res.json() as Promise<AuthorProfile>;
}

/** Подписан ли текущий пользователь на автора */
export function fetchIsFollowing(authorId: string, token: string) {
  return requestWithToken<{ following: boolean }>(`/users/${encodeURIComponent(authorId)}/follow`, token);
}

/** Лайкнул ли текущий пользователь стих */
export function fetchIsLiked(poemId: string, token: string) {
  return requestWithToken<{ liked: boolean }>(`/poems/${encodeURIComponent(poemId)}/likes/me`, token);
}
