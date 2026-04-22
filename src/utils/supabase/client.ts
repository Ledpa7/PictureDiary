import { createBrowserClient } from '@supabase/ssr'

export const createClient = (isBuildTime = false) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (isBuildTime || !supabaseUrl || !supabaseAnonKey) {
        return createBrowserClient(
            supabaseUrl || 'https://logpqjqoxgloulymlyoj.supabase.co',
            supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZ3BxanFveGdsb3VseW1seW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTU1MDQsImV4cCI6MjA4MDg3MTUwNH0.OuEg-GbnoFh_8grWzkyGeEOyCcXREJpbVav5Ol_v5tY'
        )
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
