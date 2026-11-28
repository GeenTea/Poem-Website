import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clientHeaders } from "../../client-headers";

// Шаг 3 восстановления пароля. Свой обработчик (а не общий прокси), потому что
// бэкенд в ответ отдаёт токены — их нужно положить в httpOnly-cookie, как при входе.
// Тогда пользователь после смены пароля сразу авторизован.
export async function POST(request: Request) {
  const body = await request.json();

  const response = await fetch(`${process.env.API_URL}/auth/password/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...clientHeaders(request) },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json(data, { status: response.status });
  }

  const cookieStore = await cookies();
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  cookieStore.set("accessToken", data.accessToken, { ...base, maxAge: 60 * 60 });
  cookieStore.set("refreshToken", data.refreshToken, { ...base, maxAge: 60 * 60 * 24 * 30 });

  return NextResponse.json({ ok: true });
}
