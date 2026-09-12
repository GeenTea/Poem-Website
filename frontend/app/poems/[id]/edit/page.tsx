export default async function EditPoemPage(props: PageProps<"/poems/[id]/edit">) {
  const { id } = await props.params;

  return (
    <main>
      <h1>Редактирование стиха: {id}</h1>
      {/* TODO: реализовать */}
    </main>
  );
}
