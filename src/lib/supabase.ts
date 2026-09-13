import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const isSupabaseDemoMode = 
  supabaseUrl.includes('placeholder') || 
  supabaseUrl.includes('your-project') ||
  supabaseAnonKey.includes('placeholder') ||
  supabaseAnonKey.includes('your-anon-key');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
