import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Supabase client instance using anon key
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
);

// Admin client for backend operations bypassing RLS when needed
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);
