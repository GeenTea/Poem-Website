import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { NotificationList } from "@/components/notifications/NotificationList";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  // У гостя уведомлений нет — отправляем на главную
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <NotificationList />
    </main>
  );
}
