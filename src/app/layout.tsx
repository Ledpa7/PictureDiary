import type { Metadata } from "next";
import { Gaegu } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { VisitorCounter } from "@/components/VisitorCounter";
import { cookies, headers } from "next/headers";

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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://doodlelog.pages.dev';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get('app-language')?.value;
  
  let lang = 'en';
  if (langCookie === 'ko' || langCookie === 'en') {
    lang = langCookie;
  } else {
    try {
      const headersList = await headers();
      const acceptLanguage = headersList.get('accept-language');
      if (acceptLanguage && acceptLanguage.includes('ko')) {
        lang = 'ko';
      }
    } catch (e) {
      console.warn("Failed to read headers in generateMetadata", e);
    }
  }

  const isKo = lang === 'ko';
  const siteTitle = isKo ? "두들로그 - Doodle Log" : "Doodle Log";
  const defaultTitle = isKo 
    ? "두들로그 - Doodle Log | 소중한 추억을 그림 일기로" 
    : "Doodle Log | Turn Memories into Art";
  const description = isKo
    ? "하루에 한 번, 소중한 추억을 기록하고 귀여운 AI 그림으로 받아보세요. 전 세계 모두를 위한 추억 기록 서비스."
    : "Record your daily memories and let AI turn them into cute hand-drawn illustrations. A nostalgic diary service for everyone around the world.";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: defaultTitle,
      template: `%s | ${siteTitle}`,
    },
    description: description,
    keywords: isKo
      ? ["AI 일기", "그림일기", "낙서", "일기장", "AI 그림", "추억 기록", "데일리 일기", "AI 아트 다이어리"]
      : ["AI Diary", "Picture Diary", "Doodle", "Journal", "AI Drawing", "Memory Log", "Daily Journal", "AI Art Diary"],
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
      locale: isKo ? "ko_KR" : "en_US",
      alternateLocale: [isKo ? "en_US" : "ko_KR"],
      url: "/",
      title: siteTitle,
      description: isKo 
        ? "AI로 당신의 추억을 그림으로 만들어보세요. 당신의 주머니 속 향수 어린 여정."
        : "Turn your memories into drawings with AI. A nostalgic journey in your pocket.",
      siteName: siteTitle,
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: isKo
        ? "AI로 당신의 추억을 그림으로 만들어보세요."
        : "Turn your memories into drawings with AI.",
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
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "google-site-verification-placeholder",
    },
  };
}

import { LanguageProvider } from "@/context/LanguageContext";
import { GalleryProvider } from "@/context/GalleryContext";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get('app-language')?.value;
  
  let lang = 'en';
  if (langCookie === 'ko' || langCookie === 'en') {
    lang = langCookie;
  } else {
    try {
      const headersList = await headers();
      const acceptLanguage = headersList.get('accept-language');
      if (acceptLanguage && acceptLanguage.includes('ko')) {
        lang = 'ko';
      }
    } catch (e) {
      console.warn("Failed to read headers in layout", e);
    }
  }

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
    <html lang={lang} suppressHydrationWarning>
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
        <LanguageProvider defaultLanguage={lang as 'ko' | 'en'}>
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
