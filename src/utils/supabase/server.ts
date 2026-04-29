import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async (isBuildTime = false) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        if (isBuildTime) return null as any;
        throw new Error("Missing Supabase environment variables.");
    }

    if (isBuildTime) {
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
