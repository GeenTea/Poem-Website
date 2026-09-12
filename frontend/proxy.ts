import { NextResponse, type NextRequest } from "next/server";

import { TOKEN_COOKIE } from "@/lib/auth";

/**
 * Защита роутов: проверка JWT в cookie до рендера страницы.
 *
 * ВАЖНО: в Next.js 16 файл middleware.ts переименован в proxy.ts, а экспорт
 * middleware — в proxy. Функциональность та же.
 *
 * TODO: редиректить гостя с /profile, /poems/new и /poems/[id]/edit на /login,
 * а авторизованного — с /login и /register на главную.
 */
export function proxy(request: NextRequest) {
  void request.cookies.get(TOKEN_COOKIE);
  return NextResponse.next();
}

export const config = {
  // Пропускаем статику, оптимизатор картинок и прокси к API.
  matcher: [
    "/((?!api|_next/static|_next/image|images|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
