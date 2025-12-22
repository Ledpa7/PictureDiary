import type { Metadata } from "next";
import { Gaegu } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { VisitorCounter } from "@/components/VisitorCounter";

import Link from "next/link";

const gaegu = Gaegu({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-gaegu",
});

export const viewport = {
  themeColor: "#FF8BA7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Doodle Log - AI Picture Diary",
    template: "%s | Doodle Log",
  },
  description: "Record your daily memories and let AI turn them into cute hand-drawn illustrations. A nostalgic diary service.",
  keywords: ["AI Diary", "Picture Diary", "Doodle", "Journal", "AI Drawing", "Memory Log"],
  authors: [{ name: "Doodle Log Team" }],
  creator: "Doodle Log",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Doodle Log - AI Picture Diary",
    description: "Turn your memories into drawings with AI.",
    siteName: "Doodle Log",
  },
  twitter: {
    card: "summary_large_image",
    title: "Doodle Log",
    description: "Turn your memories into drawings with AI.",
    creator: "@doodlelog",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import { LanguageProvider } from "@/context/LanguageContext";
import { GalleryProvider } from "@/context/GalleryContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${gaegu.variable} antialiased font-handwriting min-h-screen flex flex-col`}>
        <LanguageProvider>
          <GalleryProvider>
            <Header />
            <VisitorCounter />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
            <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border/40">
              <Link href="/privacy" className="hover:underline hover:text-primary transition-colors">
                Privacy Policy
              </Link>
            </footer>
          </GalleryProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
