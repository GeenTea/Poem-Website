import Link from "next/link";
import { UserMenu } from "../ui/usermenu";
import { HeaderSearch } from "./HeaderSearch";
import { FeatherIcon, PencilIcon } from "../ui/icons";
import { User } from "@/types/user";

type HeaderProps = {
  user?: User | null;
};

const navLinks = [
  { href: "/", label: "Feed" },
  { href: "/poets", label: "Poets" },
  { href: "/featured", label: "Featured" },
];


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
          <HeaderSearch />

          {user ? (
            <>
              <Link
                href="/poems/new"
                className="glass-pill focus-ring flex h-10 items-center gap-2 rounded-full px-4 text-sm text-[var(--ink)]"
              >
                <PencilIcon className="size-[18px] text-[var(--accent)]" />
                <span className="hidden sm:inline">Write</span>
              </Link>

              <UserMenu user={user} />
            </>
          ) : (
            <Link
              href="/login"
              className="focus-ring flex h-10 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[var(--accent-ink)] transition-opacity hover:opacity-90"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header;