import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fated & Forged — Jewelry for Your Chemistry",
  description: "Astrology-inspired engagement and after-dark jewelry for couples, designed with AI and made to order by Arcade.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
