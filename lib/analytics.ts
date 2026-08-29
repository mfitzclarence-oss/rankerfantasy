'use client';

/**
 * Thin wrapper around gtag. All events named in the product spec are typed
 * here so call sites get autocomplete + a compile error if an event's shape
 * drifts. The GA4 script itself is loaded once in app/layout.tsx.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type Events = {
  player_vote: { category: string; player_a: string; player_b: string; winner: string };
  vote_category_selected: { category: string };
  ranking_viewed: { category: string; filter?: string };
  player_profile_viewed: { player_id: string; player_name: string; position: string };
  trade_created: { trade_id: string; format: string; scoring: string };
  trade_vote: { trade_id: string; vote: 'team_a' | 'fair' | 'team_b' };
  trade_shared: { trade_id: string; method: string };
  account_created: { method: 'email' | 'google' };
};

export function track<E extends keyof Events>(event: E, params: Events[E]) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  if (window.gtag) {
    window.gtag('event', event, params);
  } else {
    window.dataLayer.push({ event, ...params });
  }
}
