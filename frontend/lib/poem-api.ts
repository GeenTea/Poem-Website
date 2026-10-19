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

export interface TagDto{
  id: string;
  slug: string;
  name: string;
  _count: {poems: number}
}

const API_URL = process.env.API_URL ?? "http://localhost:3001";

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`API ${path} response ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchPoems(tag?: string) {
  const params = new URLSearchParams();
  if(tag) params.set("tag", tag);

  const query = params.toString();

  return request<PoemDto[]>(`/poems/findall${query ? `?${query}` : "" }`);
}

export function fetchPoemById(id: string) {
  return request<PoemDto>(`/poems/findPoem/${encodeURIComponent(id)}`);
}

export function fetchTags(){
  return request<TagDto[]>("/tags")
}