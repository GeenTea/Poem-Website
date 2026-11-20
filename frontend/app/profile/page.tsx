import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

// «Мой профиль» — это публичная страница автора, только своя.
// Гость → вход, вошедший → /authors/<свой username>.
export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/profile")}`);
  redirect(`/authors/${encodeURIComponent(user.username)}`);
}
