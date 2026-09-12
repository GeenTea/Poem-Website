import type { Metadata } from "next";

import "./globals.css";

// TODO: подключить шрифты (next/font), провайдеры и общий каркас
// Header / Sidebar / Footer.

export const metadata: Metadata = {
  title: "Сайт стихов",
  description: "Публикация и чтение стихов",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
