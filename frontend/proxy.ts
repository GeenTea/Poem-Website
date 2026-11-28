import { NextResponse, type NextRequest } from "next/server";

// Next 16: этот файл (раньше middleware.ts) выполняется на сервере ДО страницы или route handler.
// Задача — незаметно обновлять accessToken: он живёт 1 час, а refreshToken — 30 дней.
// Если accessToken нет или он вот-вот истечёт, берём новый у бэкенда (POST /auth/refresh).

const API_URL = process.env.API_URL ?? "http://localhost:3001";
const REFRESH_MARGIN_SECONDS = 60; // обновляем заранее, за минуту до конца

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/** true, если токена нет или он истекает в ближайшую минуту. Подпись не проверяем — это делает бэкенд */
function needsRefresh(token: string | undefined): boolean {
  if (!token) return true;
  try {
    // JWT = header.payload.signature; payload — JSON в base64url
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const { exp } = JSON.parse(atob(padded)) as { exp?: unknown };
    return typeof exp !== "number" || exp - Date.now() / 1000 < REFRESH_MARGIN_SECONDS;
  } catch {
    return true; // испорченный токен — пробуем обновить
  }
}

/**
 * Продолжить запрос с изменёнными cookie: заголовок Cookie переписываем, чтобы страница /
 * route handler В ЭТОМ ЖЕ запросе через cookies() увидели уже новый токен (или его отсутствие).
 */
function continueWithCookies(request: NextRequest) {
  const headers = new Headers(request.headers);
  const cookieHeader = request.cookies
    .getAll()
    .map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
    .join("; ");
  if (cookieHeader) headers.set("cookie", cookieHeader);
  else headers.delete("cookie");

  return NextResponse.next({ request: { headers } });
}

export async function proxy(request: NextRequest) {
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // Гость, или токен ещё свежий — ничего не делаем (никаких запросов к бэкенду)
  if (!refreshToken || !needsRefresh(request.cookies.get("accessToken")?.value)) {
    return NextResponse.next();
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch (error) {
    // Бэкенд недоступен — не выкидываем пользователя, просто идём дальше
    console.error("Token refresh failed:", error);
    return NextResponse.next();
  }

  if (res.ok) {
    const { accessToken } = (await res.json()) as { accessToken: string };
    request.cookies.set("accessToken", accessToken);
    const response = continueWithCookies(request);
    response.cookies.set("accessToken", accessToken, { ...cookieBase, maxAge: 60 * 60 });
    return response;
  }

  if (res.status === 401) {
    // Сессия закрыта или истекла — пользователь становится гостем
    request.cookies.delete("accessToken");
    request.cookies.delete("refreshToken");
    const response = continueWithCookies(request);
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;
  }

  // Другая ошибка бэкенда (500 и т.п.) — оставляем cookie как есть
  return NextResponse.next();
}

export const config = {
  // Все страницы и /api/*, кроме статики Next, картинок и файлов с расширением (favicon.ico, *.svg …)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.[\w]+$).*)"],
};
