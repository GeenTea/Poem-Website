export interface CommentAuthor {
  id?: string;
  username: string;
  displayName: string | null;
  avatarUrl?: string | null;
}

/** Комментарий в том виде, как его отдаёт NestJS (`/poems/:poemId/comments`). */
export interface PoemComment {
  id: string;
  content: string;
  parentId: string | null;
  poemId: string;
  authorId: string;
  isEdited: boolean;
  createdAt: string;
  author?: CommentAuthor;
  _count?: { replies: number };
}

/** Текущий пользователь (ответ `/auth/me`). */
export interface CommentViewer extends CommentAuthor {
  id: string;
  role?: "USER" | "MODERATOR" | "ADMIN";
}
