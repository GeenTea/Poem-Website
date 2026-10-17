export interface Tag {
  name: string;
  slug: string;
}

export interface Author {
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface Poem {
  id: string;
  title: string;
  text: string;
  publishedAt: string;
  readingMinutes: number;
  tags: Tag[];
  author: Author;
  stats: {
    likes: number;
    comments: number;
  };
}