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

/** Публичный профиль автора — ответ `GET /users/:username/profile` */
export interface AuthorProfile {
  id: string
  username: string
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  createdAt: string
  stats: {
    /** Опубликованные стихи */
    poems: number
    /** Лайки на опубликованных стихах */
    likes: number
    /** Подписаны на автора */
    followers: number
    /** Автор подписан */
    following: number
  }
}
