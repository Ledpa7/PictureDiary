import { createBrowserClient } from '@supabase/ssr'

export const createClient = (isBuildTime = false) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (isBuildTime || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return createBrowserClient(
            supabaseUrl || 'https://placeholder.supabase.co',
            supabaseAnonKey || 'placeholder'
        )
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
