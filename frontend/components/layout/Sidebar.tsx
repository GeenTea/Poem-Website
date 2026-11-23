'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ChevronRight, LogOut, Settings, User as UserIcon, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { LogoutButton } from '@/components/ui/Logoutbutton';
import type { User } from '@/types/user';

type SidebarProps = {
  user: User;
  open: boolean;
  onClose: () => void;
}

// Пункты меню. Иконка — сам компонент (не <Icon />), чтобы нарисовать его в .map()
const links = [
  { href: '/profile', label: 'Profile', icon: UserIcon },
  { href: '/my-poems', label: 'My poems', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

/**
 * Мобильное меню пользователя на весь экран.
 * Открывается кликом по аватару в шапке (только на узком экране — на широком есть выпадающее меню).
 */
export default function Sidebar({ user, open, onClose }: SidebarProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const name = user.displayName || user.username;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Модальное окно делает остальную страницу некликабельной — открываем только на телефоне
    const isMobile = window.matchMedia('(max-width: 767px)').matches;

    if (open && isMobile && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // /profile перенаправляет на /authors/<username> — считаем активным и его
  function isActive(href: string) {
    if (href === '/profile') return pathname === '/profile' || pathname === `/authors/${user.username}`;
    return pathname === href;
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label="Menu"
      // display (flex) задаём НЕ здесь, а на обёртке внутри: класс flex на <dialog>
      // перебил бы display: none у закрытого окна, и оно было бы видно всегда
      className="modal m-0 h-dvh max-h-none w-screen max-w-none bg-[var(--cream)] p-0 text-ink"
    >
      <div className="flex min-h-full flex-col gap-6 px-5 pb-8 pt-5">
        {/* ---------- Верхняя строка ---------- */}
        <div className="flex items-center justify-between">
          <span className="font-serif text-xl tracking-wide">Poem Nest</span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="glass-pill focus-ring grid size-10 place-items-center rounded-full text-ink"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* ---------- Карточка профиля ---------- */}
        <div className="auth-card flex flex-col items-center rounded-[24px] bg-[var(--glass)] px-6 py-7 text-center">
          <Avatar name={name} src={user.avatarUrl} size="xl" className="ring-4 ring-white/70" />
          <p className="mt-4 font-serif text-2xl leading-tight">{name}</p>
          <p className="mt-1 text-sm text-ink-muted">@{user.username}</p>
        </div>

        {/* ---------- Меню ---------- */}
        <nav aria-label="Account">
          <ul className="auth-card divide-y divide-[var(--glass-border)] overflow-hidden rounded-[24px] bg-[var(--glass)]">
            {links.map((link) => {
              const Icon = link.icon; // с заглавной — иначе React примет <icon> за HTML-тег
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    aria-current={active ? 'page' : undefined}
                    className={`focus-ring flex items-center gap-4 px-5 py-4 text-lg transition-colors hover:bg-[var(--glass-hover)] text-ink`}
                  >
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-full bg-leaf/20 text-leaf-deep`}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="flex-1">{link.label}</span>
                    <ChevronRight className="size-5 text-ink-muted" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ---------- Выход: отдельно и внизу ---------- */}
        <div className="mt-auto">
          <LogoutButton className="glass-pill focus-ring flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-medium text-berry">
            <LogOut className="size-5" aria-hidden />
            Log out
          </LogoutButton>
        </div>
      </div>
    </dialog>
  );
}

export { Sidebar };
