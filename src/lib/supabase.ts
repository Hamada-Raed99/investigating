/**
 * Supabase client singleton for the investigation game frontend.
 * Lazily initialized so the app can run in demo mode without credentials.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function readSupabaseUrl(): string | undefined {
  const value = import.meta.env.VITE_SUPABASE_URL?.trim();
  return value || undefined;
}

function readSupabaseAnonKey(): string | undefined {
  const value = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  return value || undefined;
}

/** True when both Supabase env vars are present and look valid. */
export function isSupabaseConfigured(): boolean {
  const url = readSupabaseUrl();
  const key = readSupabaseAnonKey();

  return Boolean(
    url &&
      key &&
      !url.includes('your-project') &&
      url.startsWith('https://') &&
      url.includes('.supabase.co'),
  );
}

/** Returns the Supabase client; throws only if called when not configured. */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  if (!client) {
    client = createClient(readSupabaseUrl()!, readSupabaseAnonKey()!);
  }

  return client;
}

if (!isSupabaseConfigured() && import.meta.env.DEV) {
  console.warn(
    'Supabase not configured — running in demo mode. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env for live data.',
  );
}
