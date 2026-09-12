export default async function AuthorPage(props: PageProps<"/authors/[username]">) {
  const { username } = await props.params;

  return (
    <main>
      <h1>Автор: {username}</h1>
      {/* TODO: реализовать */}
    </main>
  );
}
