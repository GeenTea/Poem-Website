import Link from "next/link";

type User = {
  name: string;
  avatarUrl?: string;
};

type HeaderProps = {
  user?: User | null;
};

const navLinks = [
  { href: "/feed", label: "Feed" },
  { href: "/poets", label: "Poets" },
  { href: "/featured", label: "Featured" },
];

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-5">
      <nav className="glass-bar mx-auto flex max-w-6xl items-center gap-3 rounded-2xl px-3 py-2.5 sm:gap-6 sm:px-4 sm:py-3">
        {/* Логотип */}
        <Link
          href="/"
          className="focus-ring flex shrink-0 items-center gap-3 rounded-xl"
        >
          <span className="logo-mark grid size-10 place-items-center rounded-full">
            <FeatherIcon className="size-[18px] text-[var(--leaf-deep)]" />
          </span>
          <span className="font-serif text-lg tracking-wide text-[var(--ink)] sm:text-xl">
            Poem Nest
          </span>
        </Link>

        {/* Навигация */}
        <ul className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="focus-ring rounded-md text-sm text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Действия справа */}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/search"
            aria-label="Поиск"
            className="glass-pill focus-ring grid size-10 place-items-center rounded-full text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
          >
            <SearchIcon className="size-[18px]" />
          </Link>

          {user ? (
            <>
              <Link
                href="/write"
                className="glass-pill focus-ring flex h-10 items-center gap-2 rounded-full px-4 text-sm text-[var(--ink)]"
              >
                <PencilIcon className="size-[18px] text-[var(--accent)]" />
                <span className="hidden sm:inline">Write</span>
              </Link>

              <Link
                href="/profile"
                aria-label={user.name}
                className="focus-ring rounded-full"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="size-9 rounded-full object-cover ring-1 ring-[var(--glass-border)]"
                  />
                ) : (
                  <span className="grid size-9 place-items-center rounded-full bg-[var(--avatar-bg)] text-xs font-medium text-[var(--ink)] ring-1 ring-[var(--glass-border)]">
                    {getInitials(user.name)}
                  </span>
                )}
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="focus-ring flex h-10 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[var(--accent-ink)] transition-opacity hover:opacity-90"
            >
              Sign up
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header;

/* ---------- Иконки ---------- */

type IconProps = { className?: string };

function FeatherIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <path d="M16 8 2 22" />
      <path d="M17.5 15H9" />
    </svg>
  );
}

function SearchIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function PencilIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}