'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSessionId } from '@/lib/session';
import { DEFAULT_UNLOCK_PROGRESS, TOKENS_CHANGED_EVENT, UNLOCK_TOTAL, type UnlockProgress } from '@/lib/tokens';

/** Compact voting-plan status, placed beside the matchup where it is useful. */
export function TokenBadge({ className = '' }: { className?: string }) {
  const [supabase] = useState(createClient);
  const [progress, setProgress] = useState<UnlockProgress>(DEFAULT_UNLOCK_PROGRESS);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const sid = getSessionId();
    if (!sid) return;
    const { data } = await supabase.rpc('get_unlock_progress', { p_session_id: sid }).single();
    if (data) setProgress(data as UnlockProgress);
    setLoaded(true);
  }, [supabase]);

  useEffect(() => {
    refresh();
    window.addEventListener(TOKENS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(TOKENS_CHANGED_EVENT, refresh);
  }, [refresh]);

  if (!loaded) return null;

  return (
    <span
      title={progress.unlocked ? 'Rankings and Trades unlocked' : `${progress.qualified_votes}/${UNLOCK_TOTAL} required category votes complete`}
      className={`pill !gap-2 !border-accent/35 !bg-accent/10 !px-3 !py-1.5 ${className}`}
    >
      <span aria-hidden>{progress.unlocked ? '✓' : '↗'}</span>
      {progress.unlocked ? 'Rankings unlocked' : `Voting plan ${progress.qualified_votes}/${UNLOCK_TOTAL}`}
    </span>
  );
}
