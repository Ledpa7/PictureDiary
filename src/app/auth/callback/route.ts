import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") ?? "/gallery";
    const origin = requestUrl.origin;

    try {
        if (code) {
            // 공통 서버 클라이언트 사용 (쿠키 예외 처리 포함됨)
            const supabase = await createClient();

            const { error } = await supabase.auth.exchangeCodeForSession(code);

            if (!error) {
                return NextResponse.redirect(`${origin}${next}`);
            }

            console.error("Auth Callback Error:", error.message);
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`);
        }
    } catch (e: any) {
        console.error("Auth Callback Crash:", e.message);
        // 상세 에러 메시지를 화면에 출력하여 원인 파악
        return new Response(`Auth Callback Crash: ${e.message}. \nStack: ${e.stack}`, { status: 500 });
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`);
}
