import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client setup for server-side API routes
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

// Create two clients:
// 1. Admin client with service role key (bypasses RLS) - for scraper/cron jobs
// 2. Public client with anon key (respects RLS) - for API endpoints

let supabaseAdmin;
if (supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} else {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not found. Admin operations will fail.');
}

let supabase;
if (supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY not found. Public operations will fail.');
}

export { supabase, supabaseAdmin };