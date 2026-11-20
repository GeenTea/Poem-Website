// Клиентский API подписок (браузер). Токен добавляет прокси app/api/[...path].

export class FollowRequestError extends Error {
  constructor(public status: number) {
    super(`Follow request failed with status ${status}`);
  }
}

async function send(authorId: string, method: "POST" | "DELETE") {
  const res = await fetch(`/api/users/${encodeURIComponent(authorId)}/follow`, { method });
  if (!res.ok) throw new FollowRequestError(res.status);
}

export const followsApi = {
  /** POST /users/:id/follow. 409 — уже подписан */
  follow: (authorId: string) => send(authorId, "POST"),
  /** DELETE /users/:id/follow. 404 — не был подписан */
  unfollow: (authorId: string) => send(authorId, "DELETE"),
};
