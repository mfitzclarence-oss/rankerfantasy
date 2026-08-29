'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics';

export function PlayerProfileTracker({
  playerId,
  playerName,
  position,
}: {
  playerId: string;
  playerName: string;
  position: string;
}) {
  useEffect(() => {
    track('player_profile_viewed', { player_id: playerId, player_name: playerName, position });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);
  return null;
}
