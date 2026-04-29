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
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=missing_env_vars`);
        }

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

