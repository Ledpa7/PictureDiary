"use client"

import Image from "next/image";
import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';

export default function Home() {
  const [lang, setLang] = useState<'ko' | 'en'>('ko');

  const content = {
    ko: {
      title: "나만의 그림 일기장",
      subtitle: "소중한 추억을 기록하고, 아름다운 그림으로 간직하세요.",
      button: "구글로 시작하기",
      gallery: "최근 올라온 일기"
    },
    en: {
      title: "My Own Picture Diary",
      subtitle: "Record precious memories and keep them as beautiful drawings.",
      button: "Start with Google",
      gallery: "Recent Diaries"
    }
  };

  const handleLogin = async () => {
    try {
      const supabase = createClient();
      console.log('Starting Google Login...');
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
      alert('로그인 오류가 발생했습니다: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      {/* Language Toggle */}
      <div className="absolute top-6 right-6 flex gap-2 z-10">
        <button
          onClick={() => setLang('ko')}
          className={`px-3 py-1.5 text-sm rounded-full transition-all duration-200 ${lang === 'ko' ? 'bg-primary text-white font-bold shadow-md' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}`}
        >
          KR
        </button>
        <button
          onClick={() => setLang('en')}
          className={`px-3 py-1.5 text-sm rounded-full transition-all duration-200 ${lang === 'en' ? 'bg-primary text-white font-bold shadow-md' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}`}
        >
          EN
        </button>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-8 gap-16 sm:p-20">
        {/* Hero Section */}
        <section className="flex flex-col gap-8 items-center text-center max-w-2xl mt-12">
          <h1 className="text-5xl font-bold text-primary leading-tight">
            {content[lang].title}
          </h1>
          <p className="text-xl text-foreground max-w-md mx-auto text-stone-600">
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
          <h2 className="text-2xl font-bold text-center text-stone-600 relative">
            <span className="bg-white px-6 relative z-10">{content[lang].gallery}</span>
            <div className="absolute top-1/2 left-0 w-full h-px bg-stone-200 -z-0"></div>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 px-4">
            {[10, 15, 20, 25].map((seed, i) => (
              <div key={i} className="aspect-[3/4] bg-white p-4 rounded-sm shadow-md border border-stone-100 transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer group">
                <div className="relative w-full h-[85%] bg-stone-50 overflow-hidden rounded-sm mb-3 border border-stone-100">
                  <Image
                    src={`https://picsum.photos/seed/${seed}/400/500`}
                    alt="Diary Entry"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="font-handwriting text-stone-500 text-sm text-center flex justify-between px-1">
                  <span>2025. 12. {seed}</span>
                  <span>User_{seed}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="py-8 flex gap-6 flex-wrap items-center justify-center text-muted-foreground border-t border-stone-100">
        <p>© 2025 AI Picture Diary</p>
      </footer>
    </div>
  );
}
