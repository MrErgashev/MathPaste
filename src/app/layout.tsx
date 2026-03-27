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

// Inline script to prevent FOUC (Flash of Unstyled Content)
const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('mathpaste-theme');
      var isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) document.documentElement.classList.add('dark');
    } catch(e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uz"
      className={`${dmSans.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
