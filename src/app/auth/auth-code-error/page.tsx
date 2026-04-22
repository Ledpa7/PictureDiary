"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useLanguage } from "@/context/LanguageContext";

function ErrorMessage() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");
    const { language } = useLanguage();

    const title = language === 'ko' ? "로그인 오류" : "Login Failed";
    const description = language === 'ko'
        ? "인증 과정에서 문제가 발생했습니다."
        : "Something went wrong during authentication.";
    const buttonText = language === 'ko' ? "홈으로 돌아가기" : "Return Home";

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
            <h1 className="text-4xl font-bold mb-4">{title}</h1>
            <p className="text-lg mb-8 text-muted-foreground max-w-md">
                {description}
            </p>
            {error && (
                <div className="mb-8 p-4 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800">
                    Error Code: {error}
                </div>
            )}
            <Link
                href="/"
                className="px-6 py-3 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:opacity-80 transition-opacity font-medium"
            >
                {buttonText}
            </Link>
        </div>
    );
}

export default function AuthCodeError() {
    return (
        <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
            <ErrorMessage />
        </Suspense>
    );
}
