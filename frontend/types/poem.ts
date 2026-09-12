import type { User } from "./user";

/** TODO: описать под контракт NestJS. */
export interface Tag {
  id: string;
  slug: string;
  name: string;
}

export interface Poem {
  id: string;
  title: string;
  content: string;
  author: User;
  tags: Tag[];
}
