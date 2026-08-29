export const UNLOCK_COST = 20;

export interface TokenStatus {
  earned: number;
  spent: number;
  balance: number;
  unlocked: boolean;
}

export const DEFAULT_TOKEN_STATUS: TokenStatus = { earned: 0, spent: 0, balance: 0, unlocked: false };

/** Custom event fired whenever this session's token balance might have changed (after a vote, after an unlock) — TokenBadge and TokenGate both listen for it to refresh without a page reload. */
export const TOKENS_CHANGED_EVENT = 'rf:tokens-changed';

export function notifyTokensChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(TOKENS_CHANGED_EVENT));
  }
}
