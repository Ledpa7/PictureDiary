import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    try {
        const requestUrl = new URL(request.url);
        const origin = requestUrl.origin;
        const code = requestUrl.searchParams.get("code");
        const next = requestUrl.searchParams.get("next") ?? "/gallery";

        if (code) {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://logpqjqoxgloulymlyoj.supabase.co'
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZ3BxanFveGdsb3VseW1seW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTU1MDQsImV4cCI6MjA4MDg3MTUwNH0.OuEg-GbnoFh_8grWzkyGeEOyCcXREJpbVav5Ol_v5tY'

            let response = NextResponse.redirect(`${origin}${next}`);

            const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                        response = NextResponse.redirect(`${origin}${next}`);
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        );
                    },
                },
            });

            const { error } = await supabase.auth.exchangeCodeForSession(code);

            if (!error) {
                return response;
            }

            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`);
        }

        const errorCode = requestUrl.searchParams.get("error");
        const errorDescription = requestUrl.searchParams.get("error_description");

        if (errorCode) {
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(errorDescription || errorCode)}`);
        }

        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`);
    } catch (e: any) {
        return new Response(JSON.stringify({
            error: e.message,
            stack: e.stack,
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
