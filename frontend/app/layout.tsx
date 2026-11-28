import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import {Inter, Roboto} from 'next/font/google'
import Footer from "@/components/layout/Footer";
import { getPreferences } from "@/lib/preferences";
import "./globals.css";


const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
const roboto = Roboto({
  subsets: ["latin", "cyrillic"],
  weight: ["700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Сайт стихов",
  description: "Публикация и чтение стихов",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Пользователь и настройки оформления (тема, размер стихов) читаются параллельно
  const [user, { theme, poemSize }] = await Promise.all([getCurrentUser(), getPreferences()]);

  // data-theme и data-poem-size ставит сервер — страница сразу приходит в нужной теме, без мигания
  return (
    <html
      lang="ru"
      className={`${inter.variable} ${roboto.variable}`}
      data-theme={theme}
      data-poem-size={poemSize}
    >

      <body>
        <Header user={user}></Header>
        {children}
        <Footer></Footer>
      </body>
    </html>
  );
}
