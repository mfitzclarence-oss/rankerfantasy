import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Deliberately untyped clients (no <Database> generic) — see the note in
// lib/supabase/client.ts. lib/database.types.ts remains the source of truth
// for row shapes; cast `data` to those interfaces at each call site.

/**
 * True once real Supabase credentials are present. Data-fetching helpers
 * (lib/rankings.ts, lib/trades.ts, the home page) check this first so
 * `npm run build` and a fresh, un-configured checkout render an empty
 * state instead of throwing — see each helper's try/catch.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Server Supabase client for use in Server Components, Route Handlers and
 * Server Actions. Reads/writes the Supabase auth cookie so `auth.uid()` is
 * available to RLS policies and RPC functions.
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component with no writable cookie jar —
            // middleware.ts refreshes the session instead.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // See note above.
          }
        },
      },
    }
  );
}

/**
 * Admin client using the service-role key. SERVER-ONLY — never import this
 * from a Client Component or anything bundled to the browser. Used for the
 * seed script and trusted server-side maintenance tasks. It bypasses RLS
 * entirely, so every call site must apply its own authorization checks.
 */
export function createAdminSupabaseClient() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
