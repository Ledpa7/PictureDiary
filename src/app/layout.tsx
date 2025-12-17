import type { Metadata } from "next";
import { Gaegu } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

import Link from "next/link";

const gaegu = Gaegu({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-gaegu",
});

export const metadata: Metadata = {
  title: "Doodle Log",
  description: "A nostalgic diary that turns your memories into drawings.",
};

import { LanguageProvider } from "@/context/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${gaegu.variable} antialiased font-handwriting min-h-screen flex flex-col`}>
        <LanguageProvider>
          <Header />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border/40">
            <Link href="/privacy" className="hover:underline hover:text-primary transition-colors">
              Privacy Policy
            </Link>
          </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
