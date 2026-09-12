export default async function PoemPage(props: PageProps<"/poems/[id]">) {
  const { id } = await props.params;

  return (
    <main>
      <h1>Стих: {id}</h1>
      {/* TODO: реализовать */}
    </main>
  );
}
