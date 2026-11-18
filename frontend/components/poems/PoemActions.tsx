"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { poemErrorMessage, poemsApi } from "@/lib/poems-client-api";
import type { Poem } from "@/types/poem";
import { isModerator, type User } from "@/types/user";

export type PoemActionsPoem = Pick<Poem, "id" | "status" | "hiddenById"> & { authorId: string };
export type PoemActionsViewer = Pick<User, "id" | "role">;

type Props = {
  poem: PoemActionsPoem;
  /** Текущий пользователь; null — гость (меню не показываем) */
  viewer: PoemActionsViewer | null;
};

/**
 * Меню «⋯» стиха: Edit (только автор), Hide / Unhide (автор и модераторы, по правилам плана).
 * Если прав нет ни на одно действие — ничего не рисует.
 */
export function PoemActions({ poem, viewer }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!viewer) return null;

  const isAuthor = viewer.id === poem.authorId;
  const isMod = isModerator(viewer);
  // Скрыл сам автор — значит, автор может и вернуть
  const hiddenByAuthor = poem.hiddenById === poem.authorId;

  async function run(action: "hide" | "unhide") {
    setBusy(true);
    setError(null);
    try {
      await poemsApi[action](poem.id);
      // Сервер перерисует страницу со свежими данными (прокси уже сбросил кэш ленты)
      router.refresh();
    } catch (err) {
      setError(poemErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function handleHide() {
    const message =
      isAuthor
        ? "Hide this poem? Readers won't see it anymore. You can bring it back later."
        : "Hide this poem? Readers won't see it anymore, and the author won't be able to bring it back — only moderators can.";
    if (!window.confirm(message)) return;
    void run("hide");
  }

  const items: ActionMenuItem[] = [];

  if (isAuthor) {
    items.push({ label: "Edit", onSelect: () => router.push(`/poems/${poem.id}/edit`), disabled: busy });
  }

  if (poem.status === "PUBLISHED" && (isAuthor || isMod)) {
    items.push({ label: "Hide", onSelect: handleHide, danger: true, disabled: busy });
  }

  if (poem.status === "ARCHIVED") {
    if (isMod || (isAuthor && hiddenByAuthor)) {
      items.push({ label: "Unhide", onSelect: () => void run("unhide"), disabled: busy });
    } else if (isAuthor) {
      // Скрыл модератор — автор вернуть не может, просто объясняем
      items.push({ label: "Hidden by a moderator", onSelect: () => {}, disabled: true });
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <ActionMenu items={items} label="Poem actions" />
      {error && (
        <p
          role="alert"
          className="glass-panel absolute right-0 top-full z-20 mt-1 w-56 rounded-xl px-3 py-2 text-xs text-berry"
        >
          {error}{" "}
          <button
            type="button"
            onClick={() => setError(null)}
            className="focus-ring rounded font-medium underline"
          >
            Dismiss
          </button>
        </p>
      )}
    </div>
  );
}
