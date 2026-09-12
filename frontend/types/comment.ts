import type { User } from "./user";

/** TODO: описать под контракт NestJS. */
export interface Comment {
  id: string;
  poemId: string;
  author: User;
  content: string;
}
