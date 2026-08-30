'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getSessionId } from '@/lib/session';
import { DEFAULT_TOKEN_STATUS, TOKENS_CHANGED_EVENT, UNLOCK_COST, notifyTokensChanged, type TokenStatus } from '@/lib/tokens';

/**
 * Soft paywall: `children` is server-rendered content (so it's present in
 * the raw HTML for SEO/crawlers/link previews — see the note in the README
 * about the SEO tradeoff), visually blurred + overlaid with an unlock prompt
 * for real visitors who haven't earned/spent enough tokens yet.
 */
export function TokenGate({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(createClient);
  const [status, setStatus] = useState<TokenStatus>(DEFAULT_TOKEN_STATUS);
  const [loaded, setLoaded] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const sid = getSessionId();
    if (!sid) return;
    const { data, error: rpcError } = await supabase.rpc('get_token_status', { p_session_id: sid }).single();
    if (data) setStatus(data as TokenStatus);
    if (rpcError) setError('Could not check your token balance. Please retry.');
    setLoaded(true);
  }

  useEffect(() => {
    refresh();
    window.addEventListener(TOKENS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(TOKENS_CHANGED_EVENT, refresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUnlock() {
    setUnlocking(true);
    setError(null);
    const sid = getSessionId();
    const { data, error: rpcError } = await supabase.rpc('unlock_site', { p_session_id: sid }).single();
    setUnlocking(false);
    if (rpcError || !data) {
      setError(rpcError?.message ?? 'Could not unlock — try again.');
      return;
    }
    setStatus(data as TokenStatus);
    notifyTokensChanged();
  }

  // Avoid a flash of the lock overlay before we know the real status —
  // render children plainly until the first check completes. This keeps
  // first paint (and SEO'd HTML) identical either way.
  if (!loaded) {
    return <div className="card mt-6 animate-pulse p-8 text-center text-sm text-white/40">Checking unlock status…</div>;
  }

  if (status.unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none select-none blur-md">
        {children}
      </div>

      <div className="absolute inset-0 flex items-start justify-center pt-10 sm:pt-16">
        <div className="card mx-4 max-w-sm p-6 text-center shadow-glow">
          <span className="text-3xl">🔒</span>
          <h2 className="mt-3 font-display text-xl font-bold text-white">Vote to unlock</h2>
          <p className="mt-2 text-sm text-white/60">
            Rankings and Trade Vote unlock once you&apos;ve earned {UNLOCK_COST} tokens — 1 token per vote you cast.
          </p>

          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-ink-700">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${Math.min(100, (status.balance / UNLOCK_COST) * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-white/40">
              {Math.max(0, status.balance)} / {UNLOCK_COST} tokens
            </p>
          </div>

          {status.balance >= UNLOCK_COST ? (
            <button onClick={handleUnlock} disabled={unlocking} className="btn-primary mt-5 w-full disabled:opacity-50">
              {unlocking ? 'Unlocking…' : `Unlock for ${UNLOCK_COST} tokens`}
            </button>
          ) : (
            <Link href="/vote" className="btn-primary mt-5 w-full">
              Vote now ({UNLOCK_COST - Math.max(0, status.balance)} more to go)
            </Link>
          )}
          {error && <p className="mt-2 text-xs text-negative">{error}</p>}
          {error && <button type="button" onClick={refresh} className="mt-2 text-xs text-accent-bright hover:underline">Retry balance check</button>}
        </div>
      </div>
    </div>
  );
}
