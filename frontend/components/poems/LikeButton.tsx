"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCount } from "@/lib/utils";

type Props = {
  poemId: string;
  initialLiked: boolean;
  initialCount: number;
  /** Гость — вместо лайка ведём на вход и возвращаем на этот стих */
  signedIn: boolean;
};

class LikeRequestError extends Error {
  constructor(public status: number) {
    super(`Like request failed with status ${status}`);
  }
}

// POST — поставить лайк, DELETE — убрать. Токен добавляет прокси /api/...
async function sendLike(poemId: string, method: "POST" | "DELETE") {
  const res = await fetch(`/api/poems/${encodeURIComponent(poemId)}/likes`, { method });
  if (!res.ok) throw new LikeRequestError(res.status);
}

/**
 * Кнопка-сердце с числом лайков.
 * Оптимистичное обновление: сердце и число меняются сразу, запрос идёт следом.
 * Ошибка — откатываем.
 */
export function LikeButton({ poemId, initialLiked, initialCount, signedIn }: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  const label = `${formatCount(count)} ${count === 1 ? "like" : "likes"}`;
  const className =
    "glass-pill focus-ring inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-ink transition-colors disabled:opacity-70";

  if (!signedIn) {
    return (
      <Link href={`/login?next=${encodeURIComponent(`/poems/${poemId}`)}`} className={className} title="Sign in to like">
        <HeartIcon filled={false} />
        {label}
      </Link>
    );
  }

  async function toggle() {
    const next = !liked;
    setPending(true);
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      await sendLike(poemId, next ? "POST" : "DELETE");
      router.refresh(); // точное число с сервера (и лента уже сброшена прокси)
    } catch (error) {
      // 409 «уже лайкнул» / 404 «лайка не было» — на сервере уже нужное состояние
      const alreadyThere =
        error instanceof LikeRequestError && (error.status === 409 || error.status === 404);
      if (!alreadyThere) {
        setLiked(!next);
        setCount((c) => Math.max(0, c + (next ? -1 : 1)));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? `Unlike (${label})` : `Like (${label})`}
      className={className}
    >
      <HeartIcon filled={liked} />
      {label}
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      className={`h-4 w-4 text-berry transition-transform ${filled ? "scale-110" : ""}`}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z"
      />
    </svg>
  );
}
