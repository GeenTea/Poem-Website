import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

// Прокси к NestJS: /api/<path> → ${API_URL}/<path>.
// Браузер не видит httpOnly-cookie accessToken, а сервер видит —
// поэтому здесь токен превращается в заголовок Authorization.
const API_URL = process.env.API_URL ?? "http://localhost:3001";

async function proxy(request: NextRequest, ctx: RouteContext<"/api/[...path]">) {
  const { path } = await ctx.params;
  const { search } = new URL(request.url);
  const target = `${API_URL}/${path.map(encodeURIComponent).join("/")}${search}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const token = (await cookies()).get("accessToken")?.value;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  try {
    const res = await fetch(target, {
      method: request.method,
      headers,
      // arrayBuffer, а не text(): иначе двоичные файлы (аватары) испортятся при пересылке
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    });

    // Стихи, лайки, комментарии изменились → сбрасываем кэш ленты (тег "poems" в lib/poem-api.ts),
    // иначе лента показывала бы старые данные до минуты.
    if (hasBody && res.ok && (path[0] === "poems" || path[0] === "poem")) {
      revalidateTag("poems", { expire: 0 });
    }

    return new Response(res.status === 204 ? null : res.body, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch (error) {
    console.error("API proxy error:", error);
    return Response.json({ message: "API is unavailable" }, { status: 502 });
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
