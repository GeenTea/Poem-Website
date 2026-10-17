import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import {Inter, Roboto} from 'next/font/google'
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
  const user = await getCurrentUser()

  return (
    <html lang="ru" className={`${inter.variable} ${roboto.variable}`}>
      <body>
        <Header user={user}></Header>
        {children}
      </body>
    </html>
  );
}
