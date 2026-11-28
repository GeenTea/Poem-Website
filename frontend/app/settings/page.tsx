import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PasswordSettings } from "@/components/settings/PasswordSettings";
import { EmailSettings } from "@/components/settings/EmailSettings";
import { UsernameSettings } from "@/components/settings/UsernameSettings";
import { SessionsSettings } from "@/components/settings/SessionsSettings";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { DataSettings } from "@/components/settings/DataSettings";
import { getPreferences } from "@/lib/preferences";

export const metadata = { title: "Settings" };

// Вкладки настроек. Новая вкладка — строка здесь и свой блок ниже.
const tabs = [
  { id: "security", label: "Security and Privacy" },
  { id: "appearance", label: "Appearance" },
  { id: "data", label: "Your data" },
] as const;
type TabId = (typeof tabs)[number]["id"];

// Настройки аккаунта. Активная вкладка — в адресе (?tab=security): ссылку на нужную
// вкладку можно скопировать, а при обновлении страницы вкладка сохраняется.
export default async function SettingsPage(props: PageProps<"/settings">) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/settings")}`);

  const [{ tab }, preferences] = await Promise.all([props.searchParams, getPreferences()]);
  const active: TabId = tabs.some((t) => t.id === tab) ? (tab as TabId) : "security";

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="mb-6 font-serif text-4xl text-ink md:ml-48">Settings</h1>

      {/*
        Вкладки-закладки, как у папки, в стиле остальных карточек сайта (стекло, тонкая рамка).
        Стык без шва: активная вкладка на 1px заходит ПОВЕРХ рамки карточки (z-10, -mr-px / -mb-px)
        и не имеет рамки со стороны карточки. Фон у обеих чуть плотнее обычного стекла (токен --surface-strong),
        поэтому перекрытый кусочек рамки не просвечивает — вкладка и карточка читаются одной фигурой.
        Телефон: вкладки сверху. От md: слева, чуть ниже верхнего края карточки.
      */}
      <div className="flex flex-col md:flex-row md:items-start">
        <nav
          aria-label="Settings sections"
          className="flex gap-1 pl-7 md:w-48 md:shrink-0 md:flex-col md:gap-2 md:pl-0 md:pt-16"
        >
          {tabs.map((t) => {
            const isActive = t.id === active;
            return (
              <Link
                key={t.id}
                href={`/settings?tab=${t.id}`}
                aria-current={isActive ? "page" : undefined}
                // replace: вкладки не засоряют историю браузера
                replace
                scroll={false}
                className={`focus-ring relative block border border-[var(--glass-border)] px-5 py-3.5 text-sm font-medium
                  backdrop-blur-xl transition-colors
                  rounded-t-xl md:rounded-l-xl md:rounded-tr-none md:text-right
                  ${
                    isActive
                      ? // Сторона, прилегающая к карточке, — без рамки и поверх рамки карточки
                        "z-10 -mb-px border-b-0 bg-surface-strong text-ink shadow-[var(--glass-highlight)] md:-mr-px md:mb-0 md:border-b md:border-r-0 md:shadow-[-8px_8px_20px_rgba(90,72,40,0.08),var(--glass-highlight)]"
                      : "mb-1 bg-[var(--glass)] text-ink-muted hover:bg-input-bg hover:text-ink md:mb-0 md:mr-2"
                  }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        {/* Карточка: та же «стеклянная» auth-card, что у профиля и стихов, только фон плотнее (токен --surface-strong) */}
        <div className="auth-card relative min-w-0 flex-1 rounded-[28px] bg-surface-strong px-6 sm:px-8">
          {/* Security and Privacy: пароль, почта, username — разделы одной вкладки */}
          {active === "security" && (
            <section aria-label="Security and Privacy" className="divide-y divide-[var(--glass-border)]">
              <div id="password" className="scroll-mt-24 py-8">
                <PasswordSettings />
              </div>
              <div id="email" className="scroll-mt-24 py-8">
                <EmailSettings email={user.email} />
              </div>
              <div id="username" className="scroll-mt-24 py-8">
                <UsernameSettings username={user.username} />
              </div>
              <div id="sessions" className="scroll-mt-24 py-8">
                <SessionsSettings />
              </div>
            </section>
          )}

          {active === "appearance" && (
            <section aria-label="Appearance" className="py-8">
              <AppearanceSettings theme={preferences.theme} poemSize={preferences.poemSize} />
            </section>
          )}

          {active === "data" && (
            <section aria-label="Your data" className="py-8">
              <DataSettings />
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
