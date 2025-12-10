"use client"

import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-sans">
      <main className="flex flex-col gap-8 row-start-2 items-center text-center">
        <h1 className="text-5xl font-bold text-primary">
          My Picture Diary
        </h1>
        <p className="text-xl text-foreground max-w-md">
          A place to keep your memories safe and turn them into beautiful drawings.
        </p>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <button
            onClick={() => alert('지금은 테스트 버전입니다! 곧 기능이 추가돼요.')}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-primary text-primary-foreground gap-2 hover:bg-[#FF9CB8] text-lg h-12 px-8 shadow-md"
          >
            Start Writing
          </button>
          <button className="rounded-full border border-solid border-black/[.08] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] hover:border-transparent text-lg h-12 px-8">
            How it works
          </button>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-muted-foreground">
        <p>© 2025 AI Picture Diary</p>
      </footer>
    </div>
  );
}
