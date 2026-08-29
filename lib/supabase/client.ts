'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client. Uses the anon key only — RLS policies (see
 * supabase/migrations) are what keep this safe. The anon client can read
 * players/rankings/trades and INSERT votes/trade_votes, but rating math
 * always happens inside SECURITY DEFINER RPC functions, never via a raw
 * UPDATE from the client.
 *
 * Deliberately untyped (no <Database> generic): PostgREST's generic typing
 * for joined selects and RPC args is brittle against a hand-written schema
 * mirror. lib/database.types.ts still documents every row shape — use it to
 * type what you destructure from `data`, e.g. `data as PlayerRow[]`.
 */
export function createClient() {
  // Fall back to harmless placeholders when unconfigured so the client can
  // still be constructed during prerendering/build of an un-configured
  // checkout — real calls then fail at request time with a normal
  // network/auth error, which every call site already handles (see
  // VoteArena's error state, TradeCard/TradeBuilder's .catch/error paths).
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  );
}
