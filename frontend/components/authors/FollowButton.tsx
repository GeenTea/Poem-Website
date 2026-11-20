"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FollowRequestError, followsApi } from "@/lib/follows-api";

type Props = {
  authorId: string;
  initialFollowing: boolean;
};

/**
 * Кнопка Follow / Following.
 * Оптимистичное обновление: меняем кнопку сразу, запрос идёт параллельно.
 * Если сервер ответил ошибкой — возвращаем как было.
 */
export function FollowButton({ authorId, initialFollowing }: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);
  const [hover, setHover] = useState(false);

  async function toggle() {
    const next = !following;
    setPending(true);
    setFollowing(next);
    try {
      await (next ? followsApi.follow(authorId) : followsApi.unfollow(authorId));
      router.refresh(); // перезапросить страницу — обновится счётчик подписчиков
    } catch (error) {
      // 409 «уже подписан» / 404 «не был подписан» — состояние на сервере и так нужное
      const alreadyThere =
        error instanceof FollowRequestError && (error.status === 409 || error.status === 404);
      if (!alreadyThere) {
        setFollowing(!next);
      }
    } finally {
      setPending(false);
    }
  }

  // На кнопке «Following» при наведении подсказываем, что клик отпишет
  const label = following ? (hover ? "Unfollow" : "Following") : "Follow";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={following}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={
        following
          ? "glass-pill focus-ring min-w-28 rounded-full px-5 py-2 text-sm font-medium text-ink transition-colors hover:text-berry disabled:opacity-60"
          : "focus-ring min-w-28 rounded-full bg-berry px-5 py-2 text-sm font-medium text-white shadow-[var(--glass-highlight)] transition hover:brightness-110 disabled:opacity-60"
      }
    >
      {label}
    </button>
  );
}
