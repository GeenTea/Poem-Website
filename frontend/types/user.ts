export type Role = "USER" | "MODERATOR" | "ADMIN";

/** Текущий пользователь — ответ `GET /auth/me`. */
export interface User {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  email: string
  role: Role
}

/** Модератор или админ — может скрывать чужие стихи и смотреть жалобы. */
export function isModerator(user: Pick<User, "role"> | null | undefined) {
  return user?.role === "MODERATOR" || user?.role === "ADMIN";
}
