import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge';



export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") ?? "/gallery";

    if (code) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://logpqjqoxgloulymlyoj.supabase.co'
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZ3BxanFveGdsb3VseW1seW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTU1MDQsImV4cCI6MjA4MDg3MTUwNH0.OuEg-GbnoFh_8grWzkyGeEOyCcXREJpbVav5Ol_v5tY'

        const cookieStore = await cookies();

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
                        // The setAll method was called from a Server Component.
                    }
                },
            },
        });

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }

        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`);
    }

    const errorCode = requestUrl.searchParams.get("error");
    const errorDescription = requestUrl.searchParams.get("error_description");

    if (errorCode) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(errorDescription || errorCode)}`);
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`);
}

