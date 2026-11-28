"use server";

// Server Functions (Server Actions) вкладки «Appearance».
// "use server" в начале файла делает каждую экспортированную async-функцию серверной:
// клиентский компонент вызывает её как обычную функцию, а Next сам отправляет POST-запрос.
// Документация: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md
// (раздел «Understanding cookie behavior in Server Functions») и 01-getting-started/07-mutating-data.md.

import { cookies } from "next/headers";
import {
  POEM_SIZE_COOKIE,
  POEM_SIZES,
  THEME_COOKIE,
  THEMES,
  type PoemSize,
  type Theme,
} from "@/lib/preferences";

const ONE_YEAR = 60 * 60 * 24 * 365;

// Аргументы Server Function приходят от клиента — проверяем их, как любые входные данные
async function setPreferenceCookie(name: string, value: string) {
  const store = await cookies();
  store.set(name, value, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
    // Читает cookie только сервер (layout), JavaScript в браузере она не нужна
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  // refresh() не нужен: после изменения cookie в Server Action Next сам перерисовывает
  // текущую страницу вместе с layout, и тот читает уже новое значение.
}

export async function setTheme(theme: Theme): Promise<{ ok: boolean }> {
  if (!THEMES.includes(theme)) return { ok: false };
  await setPreferenceCookie(THEME_COOKIE, theme);
  return { ok: true };
}

export async function setPoemSize(poemSize: PoemSize): Promise<{ ok: boolean }> {
  if (!POEM_SIZES.includes(poemSize)) return { ok: false };
  await setPreferenceCookie(POEM_SIZE_COOKIE, poemSize);
  return { ok: true };
}
