import { createClient } from '@supabase/supabase-js';

// Read env vars statically. Dynamic access such as `import.meta.env[key]` makes Vite inline
// every VITE_* variable into the client bundle — including ones that must stay secret.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseDemoMode =
  supabaseUrl.includes('placeholder') ||
  supabaseUrl.includes('your-project') ||
  supabaseAnonKey.includes('placeholder') ||
  supabaseAnonKey.includes('your-anon-key');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
