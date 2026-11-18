import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAllTags, getPoemForViewer } from "@/lib/poems";
import { ApiError } from "@/lib/poem-api";
import { PoemEditor } from "@/components/poems/PoemEditor";

export const metadata = { title: "Edit poem" };

// В этой версии Next params — Promise, поэтому его нужно дождаться (await)
export default async function EditPoemPage(props: PageProps<"/poems/[id]/edit">) {
  const { id } = await props.params;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/poems/${id}/edit`)}`);

  let poem;
  try {
    poem = await getPoemForViewer(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  // Редактирует только автор; остальным делаем вид, что страницы нет
  if (poem.author.id !== user.id) notFound();

  const allTags = await getAllTags();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <PoemEditor
        mode="edit"
        poem={poem}
        allTags={allTags}
        authorName={user.displayName || user.username}
      />
    </main>
  );
}
