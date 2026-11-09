export type NotificationType =
  | "POEM_LIKE"
  | "POEM_COMMENT"
  | "COMMENT_REPLY"
  | "COMMENT_LIKE"
  | "FOLLOW";

/** Уведомление в том виде, как его отдаёт NestJS (`GET /notifications`). */
export interface AppNotification {
  id: string;
  type: NotificationType;
  readAt: string | null;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  poem: { id: string; title: string } | null;
  comment: { id: string; content: string; poemId: string } | null;
}

export interface NotificationPage {
  items: AppNotification[];
  page: number;
  hasMore: boolean;
}
