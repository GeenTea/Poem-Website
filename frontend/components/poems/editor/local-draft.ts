// Черновик нового стиха в localStorage браузера (автосохранение на странице /poems/new).
// Только для браузера: вызывать из обработчиков событий, таймеров и эффектов, не во время рендера.

const STORAGE_KEY = "poem-draft:new";

export interface LocalDraft {
  title: string;
  content: string;
  tagSlugs: string[];
  keepDraft: boolean;
  /** ISO-дата последнего автосохранения */
  savedAt: string;
}

export function readLocalDraft(): LocalDraft | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<LocalDraft>;
    const draft: LocalDraft = {
      title: typeof data.title === "string" ? data.title : "",
      content: typeof data.content === "string" ? data.content : "",
      tagSlugs: Array.isArray(data.tagSlugs)
        ? data.tagSlugs.filter((s): s is string => typeof s === "string")
        : [],
      keepDraft: data.keepDraft !== false,
      savedAt: typeof data.savedAt === "string" ? data.savedAt : new Date().toISOString(),
    };
    // Пустой черновик восстанавливать незачем
    return draft.title.trim() || draft.content.trim() ? draft : null;
  } catch {
    // Повреждённые данные или запрещённый доступ к хранилищу (приватный режим)
    return null;
  }
}

export function writeLocalDraft(draft: LocalDraft) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearLocalDraft() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // нечего делать — хранилище недоступно
  }
}
