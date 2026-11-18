export interface Tag {
  name: string;
  slug: string;
}

export interface Author {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

/** DRAFT — черновик (видит только автор), PUBLISHED — опубликован, ARCHIVED — скрыт */
export type PoemStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface Poem {
  id: string;
  title: string;
  text: string;
  status: PoemStatus;
  /** Дата публикации; у черновика — дата создания */
  publishedAt: string;
  updatedAt: string;
  /** Кто скрыл (автор или модератор); null — не скрыт */
  hiddenById: string | null;
  hiddenAt: string | null;
  readingMinutes: number;
  tags: Tag[];
  author: Author;
  stats: {
    likes: number;
    comments: number;
  };
}
