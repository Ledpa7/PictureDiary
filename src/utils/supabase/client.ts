import { createBrowserClient } from '@supabase/ssr'

export const createClient = (isBuildTime = false) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        if (isBuildTime) {
            return createBrowserClient('https://placeholder.supabase.co', 'placeholder')
        }
        throw new Error("Missing Supabase environment variables.");
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
