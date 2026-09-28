import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";

import "./globals.css";

export const metadata: Metadata = {
  title: "Сайт стихов",
  description: "Публикация и чтение стихов",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser()

  return (
    <html lang="ru">
      <body>
        <Header user={user}></Header>
        {children}
      </body>
    </html>
  );
}
