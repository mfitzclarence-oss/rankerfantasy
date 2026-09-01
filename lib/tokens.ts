export const UNLOCK_REQUIREMENTS = {
  qb: 3,
  rb: 3,
  wr: 3,
  te: 3,
} as const;

export const UNLOCK_TOTAL = Object.values(UNLOCK_REQUIREMENTS).reduce((total, required) => total + required, 0);

export type UnlockCategory = keyof typeof UNLOCK_REQUIREMENTS;

export interface UnlockProgress {
  overall_votes: number;
  qb_votes: number;
  rb_votes: number;
  wr_votes: number;
  te_votes: number;
  k_votes: number;
  dst_votes: number;
  qualified_votes: number;
  unlocked: boolean;
}

export const DEFAULT_UNLOCK_PROGRESS: UnlockProgress = {
  overall_votes: 0,
  qb_votes: 0,
  rb_votes: 0,
  wr_votes: 0,
  te_votes: 0,
  k_votes: 0,
  dst_votes: 0,
  qualified_votes: 0,
  unlocked: false,
};

export const UNLOCK_STEPS: { category: UnlockCategory; label: string; required: number }[] = [
  { category: 'qb', label: 'QB', required: 3 },
  { category: 'rb', label: 'RB', required: 3 },
  { category: 'wr', label: 'WR', required: 3 },
  { category: 'te', label: 'TE', required: 3 },
];

export function votesForCategory(progress: UnlockProgress, category: UnlockCategory): number {
  return progress[`${category}_votes`];
}

/** The next position in the 12-vote guided run, or null once it is complete. */
export function nextRequiredCategory(progress: UnlockProgress): UnlockCategory | null {
  return UNLOCK_STEPS.find((step) => votesForCategory(progress, step.category) < step.required)?.category ?? null;
}

/** Custom event fired whenever this session's unlock progress changes after a vote. */
export const TOKENS_CHANGED_EVENT = 'rf:tokens-changed';

export function notifyTokensChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(TOKENS_CHANGED_EVENT));
  }
}
