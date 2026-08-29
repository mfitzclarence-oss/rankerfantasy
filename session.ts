'use client';

/**
 * Anonymous session identity. Every browser gets a random UUID stored in
 * localStorage on first visit. It travels with every vote/trade-vote so we
 * can enforce "one vote per matchup per session" and rate limits without
 * requiring an account. It is NOT a security boundary (a user can clear
 * storage and get a new one) — it's a friction layer, paired with the
 * server-side rate limiting in the cast_vote/cast_trade_vote RPCs.
 */
const KEY = 'rf_session_id';

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

const SEEN_KEY_PREFIX = 'rf_seen_';

/** Tracks matchups this session has already been shown, per category, to bias the matchmaker away from repeats client-side too. */
export function recordSeenPair(category: string, playerAId: string, playerBId: string) {
  if (typeof window === 'undefined') return;
  const key = `${SEEN_KEY_PREFIX}${category}`;
  const pairKey = [playerAId, playerBId].sort().join(':');
  const raw = window.sessionStorage.getItem(key);
  const seen: string[] = raw ? JSON.parse(raw) : [];
  seen.push(pairKey);
  // Keep only the most recent 40 pairs per category to bound storage.
  window.sessionStorage.setItem(key, JSON.stringify(seen.slice(-40)));
}

export function getSeenPairs(category: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const raw = window.sessionStorage.getItem(`${SEEN_KEY_PREFIX}${category}`);
  return new Set(raw ? JSON.parse(raw) : []);
}
