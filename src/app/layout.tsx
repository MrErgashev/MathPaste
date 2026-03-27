import type { Metadata } from "next";
import { DM_Sans, Newsreader, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MathPaste — Matematik formulalarni Word ga aylantirish",
  description:
    "ChatGPT, Claude yoki boshqa AI platformalardan formulali matnlarni copy-paste qilib, professional Word hujjatga aylantiring. Bepul, tez, aniq.",
  keywords: [
    "MathPaste",
    "matematik",
    "formula",
    "LaTeX",
    "Word",
    "ChatGPT",
    "Claude",
    "konverter",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uz"
      className={`${dmSans.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
