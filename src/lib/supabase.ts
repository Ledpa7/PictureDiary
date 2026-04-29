import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl || !supabaseAnonKey) {
  if (!isBuildTime) {
    throw new Error("Supabase environment variables are missing.");
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
