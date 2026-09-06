'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getGuidedVisitPlan, getSessionId, type GuidedVisitPlan } from '@/lib/session';
import { DEFAULT_UNLOCK_PROGRESS, TOKENS_CHANGED_EVENT, UNLOCK_TOTAL, type UnlockProgress } from '@/lib/tokens';

/** Compact voting-plan status, placed beside the matchup where it is useful. */
export function TokenBadge({ className = '' }: { className?: string }) {
  const [supabase] = useState(createClient);
  const [progress, setProgress] = useState<UnlockProgress>(DEFAULT_UNLOCK_PROGRESS);
  const [loaded, setLoaded] = useState(false);
  const [visitPlan, setVisitPlan] = useState<GuidedVisitPlan | null>(null);

  const refresh = useCallback(async () => {
    const plan = getGuidedVisitPlan();
    setVisitPlan(plan);
    if (!plan.requiresGuidedVoting) {
      setLoaded(true);
      return;
    }
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

  if (visitPlan && !visitPlan.requiresGuidedVoting) {
    const visitLabel = visitPlan.visitsUntilNextRun === 1 ? 'next visit' : `in ${visitPlan.visitsUntilNextRun} visits`;
    return (
      <span title={`Guided voting returns ${visitLabel}`} className={`pill !gap-2 !border-positive/35 !bg-positive/10 !px-3 !py-1.5 !text-positive ${className}`}>
        <span aria-hidden>✓</span>
        Voting optional · guide {visitLabel}
      </span>
    );
  }

  return (
    <span
      title={progress.unlocked ? 'Guided run complete — keep voting anywhere' : `${progress.qualified_votes}/${UNLOCK_TOTAL} guided position votes complete`}
      className={`pill !gap-2 !border-accent/35 !bg-accent/10 !px-3 !py-1.5 ${className}`}
    >
      <span aria-hidden>{progress.unlocked ? '✓' : '↗'}</span>
      {progress.unlocked ? '20 complete — keep voting' : `Guided voting ${progress.qualified_votes}/${UNLOCK_TOTAL}`}
    </span>
  );
}
