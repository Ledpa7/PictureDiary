"use client"

import Image from "next/image";
import Link from "next/link";
import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';
import { useLanguage } from "@/context/LanguageContext";

export default function Home() {
  const { language: lang, setLanguage: setLang } = useLanguage();

  const content = {
    ko: {
      title: "Doodle Log",
      subtitle: "하루에 한 번, 소중한 추억을 기록하고\n귀여운 AI 그림으로 받아보세요.",
      button: "구글로 시작하기",
      gallery: "다른 사람의 기록"
    },
    en: {
      title: "Doodle Log",
      subtitle: "Record your precious memories once a day and receive a cute AI drawing.",
      button: "Start with Google",
      gallery: "Other People's Logs"
    }
  };

  interface DiaryEntry {
    id: number
    userId: string
    date: string
    imageUrl: string
    caption: string
  }

  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchRecentDiaries = async () => {
      const { data: diaries, error } = await supabase
        .from('diaries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10); // Bring only recent 10

      if (diaries) {
        const mapped = diaries.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          date: new Date(d.created_at).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
          imageUrl: d.image_url,
          caption: d.content
        }));
        setEntries(mapped);
      }
    };
    fetchRecentDiaries();
  }, [lang]);

  const handleLogin = async () => {
    try {
      const redirectUrl = `${location.origin}/auth/callback?next=/gallery`;
      // alert(`Debug: Requesting redirect to ${redirectUrl}`); // Debug removed
      console.log('Starting Google Login with redirect:', redirectUrl);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback?next=/gallery`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Login Error:', error);
      alert((lang === 'ko' ? '로그인 오류가 발생했습니다: ' : 'Login Error: ') + error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-handwriting relative">
      {/* Language Toggle */}
      <div className="absolute top-6 right-6 flex gap-2 z-10 w-fit">
        <button
          onClick={() => setLang('ko')}
          className={`px-3 py-1.5 text-sm rounded-full transition-all duration-200 ${lang === 'ko' ? 'bg-primary text-white font-bold shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
        >
          KR
        </button>
        <button
          onClick={() => setLang('en')}
          className={`px-3 py-1.5 text-sm rounded-full transition-all duration-200 ${lang === 'en' ? 'bg-primary text-white font-bold shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
        >
          EN
        </button>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-8 sm:p-8">
        {/* Hero Section */}
        <section className="flex flex-col gap-8 items-center text-center max-w-2xl mt-4">
          <h1 className="text-5xl font-bold text-primary leading-tight">
            {content[lang].title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto whitespace-pre-line">
            {content[lang].subtitle}
          </p>

          <div className="flex gap-4 items-center flex-col sm:flex-row mt-4">
            <button
              onClick={handleLogin}
              className="rounded-full border border-solid border-transparent transition-all flex items-center justify-center bg-primary text-primary-foreground gap-3 hover:bg-[#FF9CB8] hover:scale-105 active:scale-95 text-lg h-14 px-10 shadow-lg shadow-pink-200/50"
            >
              <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={24} height={24} className="bg-white rounded-full p-0.5" />
              {content[lang].button}
            </button>
          </div>
        </section>

        {/* Recent Diaries Section */}
        <section className="w-full max-w-6xl flex flex-col gap-8 mt-12 mb-12">
          <h2 className="flex items-center w-full">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-2xl font-bold text-foreground px-6">{content[lang].gallery}</span>
            <div className="h-px bg-border flex-1"></div>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-0.5 border border-border bg-border">
            {entries.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-card">
                {lang === 'ko' ? '데이터를 불러오는 중이거나 아직 일기가 없습니다.' : 'Loading or no diaries yet.'}
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="flex flex-col bg-background cursor-pointer group hover:opacity-90 transition-opacity">
                  {/* Image Section - Square */}
                  <div className="relative aspect-square w-full bg-muted overflow-hidden">
                    <Image
                      src={entry.imageUrl || `https://picsum.photos/seed/${entry.id}/500/500`}
                      alt="Diary Entry"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Content Section - Below Image */}
                  <div className="p-3 flex flex-col gap-1 min-h-[80px]">
                    <div className="flex justify-between items-baseline text-xs text-muted-foreground font-handwriting">
                      <span>{entry.date}</span>
                      <Link
                        href={`/gallery/${entry.userId}`}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        className="hover:text-primary hover:underline transition-colors"
                      >
                        User_{entry.userId ? entry.userId.slice(0, 4) : '????'}
                      </Link>
                    </div>
                    <div className="text-sm text-foreground line-clamp-2 leading-relaxed font-handwriting">
                      {(() => {
                        let title = ""
                        let body = ""
                        const parts = entry.caption.split(/\r?\n/)
                        if (parts.length > 1) {
                          title = parts[0]
                          body = parts.slice(1).join(' ')
                        } else {
                          const bracketIndex = entry.caption.indexOf(']')
                          if (bracketIndex !== -1 && bracketIndex < entry.caption.length - 1) {
                            title = entry.caption.slice(0, bracketIndex + 1)
                            body = entry.caption.slice(bracketIndex + 1)
                          } else {
                            title = entry.caption
                            body = ""
                          }
                        }
                        // Clean brackets
                        title = title.replace(/^\[|\]$/g, '')

                        return (
                          <>
                            <span className="font-bold text-base mr-1">{title}</span>
                            <span className="opacity-80">{body}</span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )))}
          </div>
        </section>
      </main>

      <footer className="py-8 flex gap-6 flex-wrap items-center justify-center text-muted-foreground border-t border-border">
        <p>© 2025 AI Picture Diary</p>
      </footer>
    </div>
  );
}
