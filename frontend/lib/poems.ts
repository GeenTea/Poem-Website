import type { Poem, Tag } from "@/types/poem";
import type { AuthorProfile } from "@/types/user";
import {
  ApiError,
  fetchAuthorProfile,
  fetchIsFollowing,
  fetchIsLiked,
  fetchMyPoems,
  fetchPoemById,
  fetchPoems,
  fetchPrivatePoem,
  fetchTags,
  type PoemDto,
  type PoemFilters,
} from "@/lib/poem-api";
import { getAccessToken } from "@/lib/auth";
import { getReadingMinutes } from "@/lib/utils";

function toPoem(dto: PoemDto): Poem {
  const text = dto.content ?? "";

  return {
    id: dto.id,
    title: dto.title?.trim() || "No name",
    text,
    status: dto.status,
    publishedAt: dto.publishedAt ?? dto.createdAt,
    updatedAt: dto.updatedAt,
    hiddenById: dto.hiddenById ?? null,
    hiddenAt: dto.hiddenAt ?? null,
    readingMinutes: getReadingMinutes(text),
    tags: (dto.tags ?? []).map(({ tag }) => tag),
    author: {
      id: dto.author.id,
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

export async function getPoems(filters: PoemFilters ={}): Promise<Poem[]> {
  const dtos = await fetchPoems(filters);
  return dtos.map(toPoem);
}

/** Опубликованный стих (для всех) */
export async function getPoem(id: string): Promise<Poem> {
  return toPoem(await fetchPoemById(id));
}

/**
 * Стих для просмотра текущим пользователем: сначала публичный, а если его нет (404) —
 * приватный (черновик автора или скрытый — автору/модератору). Нет доступа → ApiError 404.
 */
export async function getPoemForViewer(id: string): Promise<Poem> {
  try {
    return await getPoem(id);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
    const token = await getAccessToken();
    if (!token) throw error;
    return toPoem(await fetchPrivatePoem(id, token));
  }
}

/** Все стихи текущего пользователя (любой статус). Гость → пустой список */
export async function getMyPoems(): Promise<Poem[]> {
  const token = await getAccessToken();
  if (!token) return [];
  return (await fetchMyPoems(token)).map(toPoem);
}

/** Теги, у которых есть стихи — для фильтра на главной */
export async function getTags(): Promise<Tag[]>{
  const dtos = await fetchTags()
  return dtos.filter((t) => t._count.poems > 0).map(({name, slug})=> ({name,slug}));
}

/** Все теги — для выбора в редакторе */
export async function getAllTags(): Promise<Tag[]> {
  const dtos = await fetchTags();
  return dtos.map(({ name, slug }) => ({ name, slug })).sort((a, b) => a.name.localeCompare(b.name));
}

/** Профиль автора по username. Нет такого → ApiError 404 */
export function getAuthorProfile(username: string): Promise<AuthorProfile> {
  return fetchAuthorProfile(username);
}

/** Подписан ли текущий пользователь на автора. Гость или ошибка → false */
export async function getIsFollowing(authorId: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;
  try {
    return (await fetchIsFollowing(authorId, token)).following;
  } catch {
    return false;
  }
}

/** Лайкнул ли текущий пользователь стих. Гость или ошибка → false */
export async function getIsLiked(poemId: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;
  try {
    return (await fetchIsLiked(poemId, token)).liked;
  } catch {
    return false;
  }
}
