// Бэкенд видит не браузер, а сервер Next. Чтобы в «Активных сеансах» было
// «Chrome on Windows» и IP пользователя, пересылаем User-Agent и X-Forwarded-For браузера.
// (Не route.ts — значит, это обычный модуль, а не адрес API.)
export function clientHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {};

  const userAgent = request.headers.get("user-agent");
  if (userAgent) headers["User-Agent"] = userAgent;

  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  if (ip) headers["X-Forwarded-For"] = ip;

  return headers;
}
