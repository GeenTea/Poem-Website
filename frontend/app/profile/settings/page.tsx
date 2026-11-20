import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAuthorProfile } from "@/lib/poems";
import { ProfileEditor } from "@/components/profile/ProfileEditor";

export const metadata = { title: "Edit profile" };

// Редактирование своего профиля: на экране только карточка профиля
export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/profile/settings")}`);

  // /auth/me не отдаёт bio — берём публичный профиль
  const profile = await getAuthorProfile(user.username);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      <ProfileEditor
        profile={{
          id: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
        }}
      />
    </main>
  );
}
