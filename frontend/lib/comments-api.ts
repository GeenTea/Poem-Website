// Клиентский API комментариев. Работает в браузере, поэтому здесь нельзя
// импортировать next/headers. Запросы идут через прокси app/api/[...path]/route.ts,
// который сам добавляет токен из httpOnly-cookie.
import type { CommentViewer, PoemComment } from "@/types/comment";

export const COMMENTS_PAGE_SIZE = 10;
export const COMMENT_MAX_LENGTH = 2000; // как @MaxLength в CreateCommentDto

export class CommentRequestError extends Error {
  constructor(public status: number) {
    super(`Comment request failed with status ${status}`);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/poems/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new CommentRequestError(res.status);
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const enc = encodeURIComponent;

export const commentsApi = {
  list: (poemId: string, page: number) =>
    request<PoemComment[]>(
      `${enc(poemId)}/comments?page=${page}&limit=${COMMENTS_PAGE_SIZE}`,
    ),
  replies: (poemId: string, commentId: string) =>
    request<PoemComment[]>(`${enc(poemId)}/comments/${enc(commentId)}/replies`),
  create: (poemId: string, content: string, parentId?: string) =>
    request<PoemComment>(`${enc(poemId)}/comments`, {
      method: "POST",
      body: JSON.stringify({ content, parentId }),
    }),
  update: (poemId: string, commentId: string, content: string) =>
    request<PoemComment>(`${enc(poemId)}/comments/${enc(commentId)}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    }),
  remove: (poemId: string, commentId: string) =>
    request<void>(`${enc(poemId)}/comments/${enc(commentId)}`, { method: "DELETE" }),
};

export function commentErrorMessage(error: unknown) {
  if (error instanceof CommentRequestError) {
    if (error.status === 401) return "Please sign in to continue.";
    if (error.status === 403) return "You don't have permission to do that.";
    if (error.status === 404) return "This note no longer exists.";
  }
  return "Something went wrong. Please try again.";
}

/** create/update не возвращают автора — подставляем текущего пользователя. */
export function withViewer(comment: PoemComment, viewer: CommentViewer | null): PoemComment {
  if (comment.author || !viewer) return comment;
  const { id, username, displayName, avatarUrl } = viewer;
  return { ...comment, author: { id, username, displayName, avatarUrl } };
}
