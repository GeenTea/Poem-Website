import { cookies } from "next/headers";

// Настройки оформления. Хранятся в cookie (а не в localStorage), чтобы сервер сразу
// отдавал страницу в нужной теме и с нужным размером шрифта — без мигания при загрузке.

export type Theme = "light" | "dark";
export type PoemSize = "s" | "m" | "l";

export const THEME_COOKIE = "theme";
export const POEM_SIZE_COOKIE = "poemSize";

export const THEMES: Theme[] = ["light", "dark"];
export const POEM_SIZES: PoemSize[] = ["s", "m", "l"];

export const DEFAULT_PREFERENCES = { theme: "light" as Theme, poemSize: "m" as PoemSize };

export interface Preferences {
  theme: Theme;
  poemSize: PoemSize;
}

/** Только на сервере. Неизвестное значение в cookie → значение по умолчанию */
export async function getPreferences(): Promise<Preferences> {
  const store = await cookies();
  const theme = store.get(THEME_COOKIE)?.value as Theme | undefined;
  const poemSize = store.get(POEM_SIZE_COOKIE)?.value as PoemSize | undefined;
  return {
    theme: theme && THEMES.includes(theme) ? theme : DEFAULT_PREFERENCES.theme,
    poemSize: poemSize && POEM_SIZES.includes(poemSize) ? poemSize : DEFAULT_PREFERENCES.poemSize,
  };
}
