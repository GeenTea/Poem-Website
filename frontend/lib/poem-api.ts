export interface PoemDto {
  id: string;
  title: string;
  content: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  tags?: Array<{ tag: { name: string; slug: string } }>;
  _count?: { likes: number; comments: number };
}

const API_URL = process.env.API_URL ?? "http://localhost:3001";

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`API ${path} ответил ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchPoems() {
  return request<PoemDto[]>("/poems/findall");
}

export function fetchPoemById(id: string) {
  return request<PoemDto>(`/poems/findPoem/${encodeURIComponent(id)}`);
}