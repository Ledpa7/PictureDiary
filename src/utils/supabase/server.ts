import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async (isBuildTime = false) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

    // 빌드 타임이거나 환경 변수가 없는 경우(프리렌더링 시) 플레이스홀더 클라이언트 반환
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
