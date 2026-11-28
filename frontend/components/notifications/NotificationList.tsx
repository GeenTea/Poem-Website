// "use client" — этот компонент работает в браузере: у него есть состояние (useState),
// эффекты (useEffect) и обработчики кликов. Серверные компоненты так не умеют.
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeDate } from "@/lib/utils";
import { emitNotificationsChanged, notificationsApi } from "@/lib/notifications-api";
import type { AppNotification } from "@/types/notification";

// Общие классы карточки — вынесены в константу, чтобы не повторять длинную строку
const card = "auth-card rounded-[24px] bg-[var(--glass)]";

/* ============================================================================
 * describe() — превращает одно уведомление в текст и ссылку.
 *
 * Пример: уведомление { type: "POEM_LIKE", actor: eli, poem: { title: "Осень" } }
 * превратится в { text: "liked your poem “Осень”", href: "/poems/123" }.
 * Имя автора действия ("eli") сюда НЕ входит — его дорисовывает разметка ниже.
 *
 * Тип возврата { text: string; href: string } обязателен для КАЖДОГО case.
 * Если добавить новый тип в NotificationType и забыть case здесь — TypeScript
 * подскажет, что функция может вернуть undefined. Это защита от падения страницы.
 * ========================================================================== */
function describe(n: AppNotification): { text: string; href: string } {
  // n.poem может быть null (например, у подписки FOLLOW стиха нет).
  // Поэтому заранее готовим «запасные» значения через тернарный оператор:
  //   условие ? значение_если_да : значение_если_нет
  const title = n.poem ? `“${n.poem.title}”` : "your poem";
  const poemHref = n.poem ? `/poems/${n.poem.id}` : "/";

  // switch по типу уведомления: для каждого типа — свой текст и своя ссылка.
  // "#comments" в конце ссылки прокручивает страницу стиха к блоку комментариев
  // (у <section> в CommentSection стоит id="comments").
  switch (n.type) {
    case "POEM_LIKE":
      return { text: `liked your poem ${title}`, href: poemHref };
    case "POEM_COMMENT":
      return { text: `left a note on ${title}`, href: `${poemHref}#comments` };
    case "COMMENT_REPLY":
      return { text: `replied to your note on ${title}`, href: `${poemHref}#comments` };
    case "COMMENT_LIKE":
      return { text: `liked your note on ${title}`, href: `${poemHref}#comments` };
    case "FOLLOW":
      // У подписки нет стиха — ведём в профиль того, кто подписался
      return { text: "started following you", href: `/authors/${n.actor.username}` };
    case "REPORT_CREATED":
      // Это уведомление получают только модераторы и админы (см. notifyModerators на бэкенде)
      // Имя не пишем — разметка сама ставит его перед текстом: «eli reported a note on “...”».
      // n.report?.type — на что жалоба: на сам стих или на комментарий под ним.
      if (n.report?.type === "POEM") {
        return { text: `reported the poem ${title}`, href: poemHref };
      }
      return { text: `reported a note on ${title}`, href: `${poemHref}#comments` };
  }
}

/* ============================================================================
 * NotificationList — список уведомлений на странице /notifications.
 * Сам загружает данные из API, умеет «показать ещё» и отмечать прочитанное.
 * ========================================================================== */
export function NotificationList() {
  /* ---------- Состояние (useState) ----------
   * Каждый useState — это «ячейка памяти» компонента. Когда она меняется
   * через setX(...), React заново рисует компонент с новым значением. */

  // Загруженные уведомления (все страницы подряд)
  const [items, setItems] = useState<AppNotification[]>([]);
  // Номер последней загруженной страницы — нужен для кнопки «Show more»
  const [page, setPage] = useState(1);
  // Есть ли на сервере ещё уведомления (бэкенд отдаёт hasMore)
  const [hasMore, setHasMore] = useState(false);
  // Что сейчас происходит: грузим / всё хорошо / ошибка
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");

  /* ---------- Загрузка страницы ----------
   * useCallback запоминает функцию между перерисовками. Без него load создавалась бы
   * заново при каждой отрисовке, и useEffect ниже (у которого load в зависимостях)
   * запускался бы бесконечно. */
  const load = useCallback((nextPage: number) => {
    notificationsApi
      .list(nextPage) // GET /api/notifications?page=N
      .then((data) => {
        // Функциональная форма setItems(prev => ...) — берём актуальный список,
        // даже если между запросом и ответом он успел измениться.
        setItems((prev) => {
          // Первая страница заменяет список целиком, следующие — дописываются в конец
          const base = nextPage === 1 ? [] : prev;
          // Защита от дублей: если пока мы листали, пришло новое уведомление,
          // страницы «съезжают», и одно и то же уведомление может прийти дважды.
          const seen = new Set(base.map((n) => n.id));
          return [...base, ...data.items.filter((n) => !seen.has(n.id))];
        });
        setPage(nextPage);
        setHasMore(data.hasMore);
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
  }, []);

  // useEffect с [load] — выполнится один раз после первого появления компонента
  // на экране: загружаем первую страницу.
  useEffect(() => {
    load(1);
  }, [load]);

  // Кнопка «Show more»: показываем «Loading…» и грузим следующую страницу
  function loadMore() {
    setStatus("loading");
    load(page + 1);
  }

  /* ---------- Отметка «прочитано» ----------
   * Используем «оптимистичное обновление»: сначала сразу меняем экран (точка
   * пропадает мгновенно), а запрос на сервер уходит параллельно. Пользователь
   * не ждёт ответа сервера. */

  // Помечает прочитанными локально (на экране) все уведомления, для которых
  // predicate вернул true. predicate — функция-фильтр: «какие именно отметить».
  function markLocallyRead(predicate: (n: AppNotification) => boolean) {
    const now = new Date().toISOString();
    // { ...n, readAt: now } — копия уведомления с изменённым полем.
    // В React состояние нельзя менять напрямую (n.readAt = now) — только новой копией.
    setItems((prev) => prev.map((n) => (predicate(n) && !n.readAt ? { ...n, readAt: now } : n)));
  }

  // Кнопка «Mark all as read»
  async function markAllRead() {
    markLocallyRead(() => true); // true для всех → отметить все
    try {
      await notificationsApi.markAllRead(); // PATCH /api/notifications/read-all
    } finally {
      // finally выполняется и при успехе, и при ошибке.
      // Сообщаем колокольчику в хедере: «перепроверь счётчик».
      emitNotificationsChanged();
    }
  }

  // Клик по уведомлению: отметить прочитанным (если ещё нет) и перейти по ссылке.
  // Переход делает сам <Link>, эта функция только отмечает.
  function openNotification(n: AppNotification) {
    if (n.readAt) return; // уже прочитано — ничего не делаем
    markLocallyRead((x) => x.id === n.id); // только это одно
    // Переход по ссылке не ждём — отметка уйдёт в фоне.
    // .then(успех, ошибка): при успехе обновляем колокольчик, ошибку тихо игнорируем.
    notificationsApi.markRead(n.id).then(emitNotificationsChanged, () => {});
  }

  // Есть ли хоть одно непрочитанное — от этого зависит, показывать ли «Mark all as read».
  // .some() возвращает true, если условие выполнилось хотя бы для одного элемента.
  const hasUnread = items.some((n) => !n.readAt);

  /* ---------- Разметка ----------
   * Конструкция {условие && (<JSX/>)} — «нарисовать, только если условие истинно».
   * Если условие ложно, React ничего не рисует. */
  return (
    <section className={`${card} p-4 sm:p-6`}>
      {/* Заголовок и кнопка «Mark all as read» */}
      <div className="mb-4 flex items-center justify-between gap-3 px-2">
        <h1 className="font-serif text-3xl text-ink">Notifications</h1>
        {hasUnread && (
          <button
            type="button"
            onClick={markAllRead}
            className="focus-ring rounded-full px-3 py-1.5 text-sm font-medium text-berry hover:bg-[var(--glass-hover)]"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Первая загрузка: список ещё пустой и идёт запрос */}
      {status === "loading" && items.length === 0 && (
        <p className="px-2 py-10 text-center text-sm text-ink-muted">Loading…</p>
      )}

      {/* Загрузилось, но уведомлений нет */}
      {status === "idle" && items.length === 0 && (
        <p className="px-2 py-10 text-center font-serif text-lg italic text-ink-muted">
          Nothing here yet. Likes, notes and new followers will show up here.
        </p>
      )}

      {/* Сам список. items.map(...) превращает каждое уведомление в <li>. */}
      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((n) => {
            // Текст и ссылка — из describe() выше
            const { text, href } = describe(n);
            // displayName может быть null (не заполнен) — тогда показываем username.
            // || берёт правое значение, если левое «пустое» (null, undefined, "").
            const name = n.actor.displayName || n.actor.username;
            const unread = !n.readAt; // readAt === null → не прочитано

            return (
              // key — обязательный уникальный ключ для элементов списка.
              // По нему React понимает, какой элемент изменился, а какой нет.
              <li key={n.id}>
                <Link
                  href={href}
                  onClick={() => openNotification(n)}
                  // Непрочитанные чуть светлее (bg-surface-faint)
                  className={`focus-ring flex items-start gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-[var(--glass-hover)] ${
                    unread ? "bg-surface-faint" : ""
                  }`}
                >
                  {/* Аватар того, кто совершил действие */}
                  <Avatar src={n.actor.avatarUrl} name={name} />

                  <span className="min-w-0 flex-1">
                    {/* Строка вида: «eli liked your poem “Осень”» */}
                    <span className="block text-sm text-ink">
                      <span className="font-medium">{name}</span> {text}
                    </span>

                    {/* Дополнительная строка: текст комментария.
                        Показываем, только если комментарий есть (n.comment не null)
                        и это не лайк комментария (там текст не нужен).
                        truncate — обрезает длинный текст многоточием в одну строку. */}
                    {n.comment && n.type !== "COMMENT_LIKE" && (
                      <span className="mt-1 block truncate font-serif italic text-ink-muted">
                        {n.comment.content}
                      </span>
                    )}

                    {n.report?.reason && (
                      <span className="mt-1 block text-xs text-berry">
                        Reason: {n.report.reason}
                      </span>
                    )}

                    {/* Когда: «3 days ago». dateTime — машиночитаемая дата для браузера. */}
                    <time dateTime={n.createdAt} className="mt-1 block text-xs text-ink-muted">
                      {formatRelativeDate(n.createdAt)}
                    </time>
                  </span>

                  {/* Точка «не прочитано» справа */}
                  {unread && (
                    <span aria-label="Unread" className="mt-2 size-2.5 shrink-0 rounded-full bg-berry" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* Ошибка загрузки + кнопка повторить.
          Если что-то уже загружено — пробуем следующую страницу, иначе первую. */}
      {status === "error" && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-ink-muted">
          Couldn&apos;t load notifications.
          <button
            type="button"
            onClick={() => {
              setStatus("loading");
              load(items.length ? page + 1 : 1);
            }}
            className="focus-ring rounded-full px-3 py-1 font-medium text-berry hover:bg-[var(--glass-hover)]"
          >
            Try again
          </button>
        </div>
      )}

      {/* «Show more» — только если сервер сказал, что есть ещё (hasMore) */}
      {hasMore && status !== "error" && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={status === "loading"}
            className="glass-pill focus-ring rounded-full px-5 py-2 text-sm text-ink disabled:opacity-60"
          >
            {status === "loading" ? "Loading…" : "Show more"}
          </button>
        </div>
      )}
    </section>
  );
}
