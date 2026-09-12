import { NextResponse, type NextRequest } from "next/server";

/**
 * Опциональный прокси к NestJS: /api/poems -> ${API_INTERNAL_URL}/poems.
 *
 * Зачем: убирает настройку CORS на бэкенде и позволяет сделать cookie с
 * токеном httpOnly — Authorization подставляется здесь, на сервере.
 *
 * TODO: реализовать проброс запроса. Адрес бэкенда брать из API_INTERNAL_URL,
 * а не из NEXT_PUBLIC_API_URL: если клиент переключить на "/api", прокси стал
 * бы ходить сам в себя.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/[...path]">) {
  const { path } = await ctx.params;
  void request;

  return NextResponse.json(
    { statusCode: 501, message: `Прокси не реализован: /${path.join("/")}` },
    { status: 501 },
  );
}
