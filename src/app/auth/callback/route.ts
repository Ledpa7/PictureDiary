import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/gallery";

    if (!code) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`);
    }

    try {
        const cookieStore = await cookies();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://logpqjqoxgloulymlyoj.supabase.co';
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZ3BxanFveGdsb3VseW1seW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTU1MDQsImV4cCI6MjA4MDg3MTUwNH0.OuEg-GbnoFh_8grWzkyGeEOyCcXREJpbVav5Ol_v5tY';

        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch (error) {
                        // 쿠키 설정 실패 시 로그만 남김 (서버 컴포넌트 호출 대비)
                        console.error("Cookie set error:", error);
                    }
                },
            },
        });

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }

        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`);
    } catch (e: any) {
        // 클라우드플레어 로그에서 확인할 수 있도록 구체적인 에러를 텍스트로 반환
        return new Response(`Crash at Auth Callback: ${e.message}\n${e.stack}`, { 
            status: 500,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
}
