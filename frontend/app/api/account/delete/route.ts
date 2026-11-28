import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Удаление аккаунта. Свой обработчик (а не общий прокси), потому что после успешного
// удаления нужно стереть httpOnly-cookie с токенами — браузер сам этого сделать не может.
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) {
    return NextResponse.json({ message: "Your session has expired. Please sign in again." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const response = await fetch(`${process.env.API_URL}/users/me`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password: body.password }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      // Ошибку (например, 400 «Password is incorrect») отдаём как есть — покажем её в окне
      return NextResponse.json(data, { status: response.status });
    }

    // Аккаунта больше нет — выходим: удаляем cookie с токенами
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ message: "API is unavailable" }, { status: 502 });
  }
}
