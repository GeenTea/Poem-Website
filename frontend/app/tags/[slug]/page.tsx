export default async function TagPage(props: PageProps<"/tags/[slug]">) {
  const { slug } = await props.params;

  return (
    <main>
      <h1>Тег: {slug}</h1>
      {/* TODO: реализовать */}
    </main>
  );
}
