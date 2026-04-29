import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async (isBuildTime = false) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://logpqjqoxgloulymlyoj.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZ3BxanFveGdsb3VseW1seW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTU1MDQsImV4cCI6MjA4MDg3MTUwNH0.OuEg-GbnoFh_8grWzkyGeEOyCcXREJpbVav5Ol_v5tY'

    if (isBuildTime || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() { return [] },
                    setAll() { },
                },
            }
        )
    }

    const cookieStore = await cookies();

    return createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    } catch (error) {
                        // The `set` method was called from a Server Component.
                    }
                },
            },
        }
    );
};
