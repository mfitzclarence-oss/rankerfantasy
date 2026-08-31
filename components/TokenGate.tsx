'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getSessionId } from '@/lib/session';
import {
  DEFAULT_UNLOCK_PROGRESS,
  TOKENS_CHANGED_EVENT,
  UNLOCK_STEPS,
  UNLOCK_TOTAL,
  nextRequiredCategory,
  votesForCategory,
  type UnlockProgress,
} from '@/lib/tokens';

/**
 * Soft paywall: `children` is server-rendered content (so it's present in
 * the raw HTML for SEO/crawlers/link previews — see the note in the README
 * about the SEO tradeoff), visually blurred + overlaid with an unlock prompt
 * for visitors who have not completed the required category voting plan.
 */
export function TokenGate({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(createClient);
  const [progress, setProgress] = useState<UnlockProgress>(DEFAULT_UNLOCK_PROGRESS);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const sid = getSessionId();
    if (!sid) return;
    const { data, error: rpcError } = await supabase.rpc('get_unlock_progress', { p_session_id: sid }).single();
    if (data) setProgress(data as UnlockProgress);
    if (rpcError) setError('Could not check your voting progress. Please retry.');
    setLoaded(true);
  }, [supabase]);

  useEffect(() => {
    refresh();
    window.addEventListener(TOKENS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(TOKENS_CHANGED_EVENT, refresh);
  }, [refresh]);

  // Avoid a flash of the lock overlay before we know the real status —
  // render children plainly until the first check completes. This keeps
  // first paint (and SEO'd HTML) identical either way.
  if (!loaded) {
    return <div className="card mt-6 animate-pulse p-8 text-center text-sm text-white/40">Checking unlock status…</div>;
  }

  if (progress.unlocked) {
    return <>{children}</>;
  }

  const nextCategory = nextRequiredCategory(progress);
  const nextStep = UNLOCK_STEPS.find((step) => step.category === nextCategory);

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none select-none blur-md">
        {children}
      </div>

      <div className="absolute inset-0 flex items-start justify-center pt-10 sm:pt-16">
        <div className="card mx-4 max-w-md p-5 text-center shadow-glow sm:p-6">
          <span className="text-2xl" aria-hidden>🔒</span>
          <h2 className="mt-2 font-display text-xl font-bold text-white">Complete 12 guided votes</h2>
          <p className="mt-2 text-sm text-white/60">
            We&apos;ll take you through two matchups at every position. Rankings and Trade Vote unlock after the twelfth vote.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {UNLOCK_STEPS.map((step) => {
              const votes = Math.min(votesForCategory(progress, step.category), step.required);
              const complete = votes >= step.required;
              const href = `/vote/${step.category}`;
              return (
                <Link
                  key={step.category}
                  href={href as any}
                  className={`rounded-xl border px-2 py-2 text-xs font-bold ${complete ? 'border-positive/40 bg-positive/10 text-positive' : 'border-ink-600 bg-ink-800 text-white/65'}`}
                >
                  <span className="block">{step.label}</span>
                  <span className="mt-0.5 block text-[11px]">{complete ? '✓' : `${votes}/${step.required}`}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-ink-700">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${Math.min(100, (progress.qualified_votes / UNLOCK_TOTAL) * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-white/40">
              {progress.qualified_votes} / {UNLOCK_TOTAL} required votes complete
            </p>
          </div>

          {nextStep && (
            <Link href={`/vote/${nextStep.category}` as any} className="btn-primary mt-5 w-full">
              Continue guided voting: {nextStep.label}
            </Link>
          )}
          {error && <p className="mt-2 text-xs text-negative">{error}</p>}
          {error && <button type="button" onClick={refresh} className="mt-2 text-xs text-accent-bright hover:underline">Retry progress check</button>}
        </div>
      </div>
    </div>
  );
}
