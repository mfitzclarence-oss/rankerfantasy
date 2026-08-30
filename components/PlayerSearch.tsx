'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PlayerRow } from '@/lib/database.types';

export function PlayerSearch({
  onSelect,
  excludeIds = [],
  placeholder = 'Search players…',
}: {
  onSelect: (player: PlayerRow) => void;
  excludeIds?: string[];
  placeholder?: string;
}) {
  const [supabase] = useState(createClient);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerRow[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      const { data } = await supabase
        .from('players')
        .select('*')
        .ilike('full_name', `%${query.trim()}%`)
        .eq('active', true)
        .limit(8);
      if (!cancelled) {
        setResults((data ?? []).filter((p) => !excludeIds.includes(p.id)));
        setOpen(true);
      }
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [excludeIds, query, supabase]);

  return (
    <div ref={containerRef} className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-ink-600 bg-ink-800 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-ink-600 bg-ink-800 shadow-card">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onSelect(p);
                setQuery('');
                setResults([]);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-ink-700"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-base font-bold text-white">{p.full_name}</span>
                <span className="block text-xs text-white/40">{p.position} &middot; {p.team_abbreviation}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
