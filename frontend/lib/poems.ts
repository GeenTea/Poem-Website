import type { Poem } from "@/types/poem";
import { fetchPoemById, fetchPoems, type PoemDto } from "@/lib/poem-api";
import { getReadingMinutes } from "@/lib/utils";

function toPoem(dto: PoemDto): Poem {
  const text = dto.content ?? "";

  return {
    id: dto.id,
    title: dto.title?.trim() || "Без названия",
    text,
    publishedAt: dto.publishedAt ?? dto.createdAt,
    readingMinutes: getReadingMinutes(text),
    tags: (dto.tags ?? []).map(({ tag }) => tag),
    author: {
      username: dto.author.username,
      displayName: dto.author.displayName || dto.author.username,
      avatarUrl: dto.author.avatarUrl,
    },
    stats: {
      likes: dto._count?.likes ?? 0,
      comments: dto._count?.comments ?? 0,
    },
  };
}

export async function getPoems(): Promise<Poem[]> {
  const dtos = await fetchPoems();
  return dtos.map(toPoem);
}

export async function getPoem(id: string): Promise<Poem> {
  return toPoem(await fetchPoemById(id));
}