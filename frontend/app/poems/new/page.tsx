import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAllTags } from "@/lib/poems";
import { PoemEditor } from "@/components/poems/PoemEditor";

export const metadata = { title: "New poem" };

// Серверный компонент: проверяет вход и загружает теги, а сам редактор —
// клиентский компонент (ему нужны состояние, localStorage и обработчики событий).
export default async function NewPoemPage() {
  const user = await getCurrentUser();
  // redirect() бросает специальную ошибку — вызываем вне try/catch
  if (!user) redirect(`/login?next=${encodeURIComponent("/poems/new")}`);

  const allTags = await getAllTags();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <PoemEditor mode="create" allTags={allTags} authorName={user.displayName || user.username} />
    </main>
  );
}
