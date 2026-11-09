import LoginForm from "@/components/auth/LoginForm";
import { getSafeRedirect } from "@/lib/utils";

export default async function LoginPage(props: PageProps<"/login">) {
  // ?next=/poems/123#comments — куда вернуть пользователя после входа
  const { next } = await props.searchParams;

  return (
    <main>
      <LoginForm next={getSafeRedirect(next)} />
    </main>
  );
}
