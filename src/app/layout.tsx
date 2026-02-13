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
  metadataBase: new URL('https://ai-picture-diary.vercel.app'),
  title: {
    default: "Doodle Log - AI Picture Diary | Turn Memories into Art",
    template: "%s | Doodle Log",
  },
  description: "Record your daily memories and let AI turn them into cute hand-drawn illustrations. A nostalgic diary service for everyone around the world.",
  keywords: ["AI Diary", "Picture Diary", "Doodle", "Journal", "AI Drawing", "Memory Log", "Daily Journal", "AI Art Diary"],
  authors: [{ name: "Doodle Log Team" }],
  creator: "Doodle Log",
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
      'ko-KR': '/',
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["ko_KR"],
    url: "/",
    title: "Doodle Log - AI Picture Diary",
    description: "Turn your memories into drawings with AI. A nostalgic journey in your pocket.",
    siteName: "Doodle Log",
  },
  twitter: {
    card: "summary_large_image",
    title: "Doodle Log - AI Picture Diary",
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
  verification: {
    google: "google-site-verification-placeholder",
  },
};

import { LanguageProvider } from "@/context/LanguageContext";
import { GalleryProvider } from "@/context/GalleryContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Doodle Log",
    "operatingSystem": "Web",
    "applicationCategory": "LifestyleApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "An AI-powered picture diary that turns your memories into cute illustrations.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "100"
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
              });
            `,
          }}
        />
      </head>
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
