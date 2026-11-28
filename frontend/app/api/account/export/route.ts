import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Скачать все свои стихи одним Markdown-файлом.
// Свой обработчик, а не общий прокси app/api/[...path]: прокси пересылает только Content-Type,
// а здесь нужен ещё Content-Disposition — по нему браузер сохраняет файл под именем poems.md.
export async function GET() {
  const token = (await cookies()).get("accessToken")?.value;
  if (!token) {
    return NextResponse.json({ message: "Please sign in to download your poems" }, { status: 401 });
  }

  try {
    const response = await fetch(`${process.env.API_URL}/users/me/export`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: "Could not export your poems" }));
      return NextResponse.json(data, { status: response.status });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "text/markdown; charset=utf-8",
        "Content-Disposition": response.headers.get("content-disposition") ?? 'attachment; filename="poems.md"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ message: "API is unavailable" }, { status: 502 });
  }
}
