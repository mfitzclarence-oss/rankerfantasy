'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSessionId } from '@/lib/session';
import { DEFAULT_TOKEN_STATUS, TOKENS_CHANGED_EVENT, UNLOCK_COST, type TokenStatus } from '@/lib/tokens';

/** Small persistent "tokens earned" indicator — shown in the nav so voting progress is always visible. */
export function TokenBadge({ className = '' }: { className?: string }) {
  const [supabase] = useState(createClient);
  const [status, setStatus] = useState<TokenStatus>(DEFAULT_TOKEN_STATUS);
  const [loaded, setLoaded] = useState(false);

  async function refresh() {
    const sid = getSessionId();
    if (!sid) return;
    const { data } = await supabase.rpc('get_token_status', { p_session_id: sid }).single();
    if (data) setStatus(data as TokenStatus);
    setLoaded(true);
  }

  useEffect(() => {
    refresh();
    window.addEventListener(TOKENS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(TOKENS_CHANGED_EVENT, refresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loaded) return null;

  return (
    <span
      title={status.unlocked ? 'Rankings & Trades unlocked' : `${status.balance}/${UNLOCK_COST} tokens toward unlocking Rankings & Trades`}
      className={`pill !gap-1.5 ${className}`}
    >
      <span>{status.unlocked ? '🔓' : '🎟️'}</span>
      {status.unlocked ? 'Unlocked' : `${Math.min(status.balance, UNLOCK_COST)}/${UNLOCK_COST}`}
    </span>
  );
}
