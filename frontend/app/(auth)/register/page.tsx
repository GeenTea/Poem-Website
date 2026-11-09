import RegisterForm from "@/components/auth/RegisterForm";
import { getSafeRedirect } from "@/lib/utils";

export default async function RegisterPage(props: PageProps<"/register">) {
  const { next } = await props.searchParams;

  return (
    <main>
      <RegisterForm next={getSafeRedirect(next)} />
    </main>
  );
}
