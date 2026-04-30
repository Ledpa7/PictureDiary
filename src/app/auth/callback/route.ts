import { NextResponse } from 'next/server';
import { createServerClient } from "@supabase/ssr";

export const runtime = 'edge';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/gallery';

    if (!code) return NextResponse.redirect(`${origin}/`);

    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://logpqjqoxgloulymlyoj.supabase.co',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZ3BxanFveGdsb3VseW1seW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTU1MDQsImV4cCI6MjA4MDg3MTUwNH0.OuEg-GbnoFh_8grWzkyGeEOyCcXREJpbVav5Ol_v5tY',
            {
                cookies: {
                    getAll: () => [],
                    setAll: () => {},
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
            return new Response(`Auth Error: ${error.message}`, { status: 500 });
        }
        
        return NextResponse.redirect(`${origin}${next}`);
    } catch (e: any) {
        return new Response(`Crash Report: ${e.message}\n${e.stack}`, { status: 500 });
    }
}
