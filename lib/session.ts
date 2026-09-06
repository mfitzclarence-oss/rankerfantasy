'use client';

/**
 * Anonymous session identity. Every browser gets a random UUID stored in
 * sessionStorage for the current visit. It travels with every vote/trade-vote so we
 * can enforce "one vote per matchup per session" and rate limits without
 * requiring an account. It is NOT a security boundary (a user can clear
 * storage and get a new one) — it's a friction layer, paired with the
 * server-side rate limiting in the cast_vote/cast_trade_vote RPCs.
 */
const KEY = 'rf_visit_session_id';
const VISIT_CYCLE_KEY = 'rf_guided_visit_cycle_v1';
export const GUIDED_VISIT_INTERVAL = 3;

export interface GuidedVisitPlan {
  visitNumber: number;
  requiresGuidedVoting: boolean;
  visitsUntilNextRun: number;
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = window.sessionStorage.getItem(KEY);
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // Storage can be unavailable in hardened/private browser contexts. Keep a
    // stable ID for this page lifetime so RPC UUID validation still succeeds.
    return getMemorySessionId();
  }
}

let memorySessionId: string | undefined;
function getMemorySessionId() {
  memorySessionId ??= crypto.randomUUID();
  return memorySessionId;
}

/**
 * Counts a fresh browser session as one visit. Reloads keep the same session
 * ID, so they do not advance the cycle. The guide runs on visits 1, 4, 7…;
 * storage-restricted browsers safely fall back to requiring the guide.
 */
export function getGuidedVisitPlan(): GuidedVisitPlan {
  const sessionId = getSessionId();
  if (!sessionId) return { visitNumber: 1, requiresGuidedVoting: true, visitsUntilNextRun: 0 };

  try {
    const raw = window.localStorage.getItem(VISIT_CYCLE_KEY);
    const stored = raw ? JSON.parse(raw) as { visitNumber?: unknown; lastSessionId?: unknown } : null;
    const previousVisit = typeof stored?.visitNumber === 'number' && Number.isInteger(stored.visitNumber) && stored.visitNumber > 0
      ? stored.visitNumber
      : 0;
    const visitNumber = stored?.lastSessionId === sessionId ? Math.max(previousVisit, 1) : previousVisit + 1;

    if (stored?.lastSessionId !== sessionId) {
      window.localStorage.setItem(VISIT_CYCLE_KEY, JSON.stringify({ visitNumber, lastSessionId: sessionId }));
    }

    const cycleIndex = (visitNumber - 1) % GUIDED_VISIT_INTERVAL;
    return {
      visitNumber,
      requiresGuidedVoting: cycleIndex === 0,
      visitsUntilNextRun: cycleIndex === 0 ? 0 : GUIDED_VISIT_INTERVAL - cycleIndex,
    };
  } catch {
    return { visitNumber: 1, requiresGuidedVoting: true, visitsUntilNextRun: 0 };
  }
}

const SEEN_KEY_PREFIX = 'rf_seen_';

/** Tracks matchups this session has already been shown, per category, to bias the matchmaker away from repeats client-side too. */
export function recordSeenPair(category: string, playerAId: string, playerBId: string) {
  if (typeof window === 'undefined') return;
  const key = `${SEEN_KEY_PREFIX}${category}`;
  const pairKey = [playerAId, playerBId].sort().join(':');
  try {
    const raw = window.sessionStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    const seen: string[] = Array.isArray(parsed) ? parsed : [];
    seen.push(pairKey);
    window.sessionStorage.setItem(key, JSON.stringify(seen.slice(-40)));
  } catch {
    // Matchmaking remains authoritative server-side if sessionStorage fails.
  }
}

export function getSeenPairs(category: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.sessionStorage.getItem(`${SEEN_KEY_PREFIX}${category}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}
