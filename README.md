# RankUp Fantasy

Vote. Rank. Settle the debate.

A pairwise-voting fantasy football web app for the 2026 NFL season. Two players, one tap: "Who would you rather have?" Every vote updates a live, per-category Elo rating, which powers the Rankings pages. A second feature, Trade Vote, lets the community judge submitted trades.

This document is both the architecture proposal and the as-built reference — it describes what was actually implemented, phase by phase, plus the decisions and risks worth knowing before you launch.

---

## 1. Architecture

**Stack:** Next.js 14 (App Router, TypeScript) · Supabase (Postgres, Auth, RLS) · Tailwind CSS · deployed to Vercel + Supabase Cloud.

- **Frontend:** Next.js Server Components fetch and render rankings, player profiles, and the trade feed (fast, SEO-indexable HTML on first load). Voting, trade submission, and trade voting are Client Components that talk to Supabase directly via `@supabase/supabase-js`/`@supabase/ssr` — there's no custom API layer in between for those actions.
- **Database:** Supabase Postgres is the single source of truth. All rating math lives in `SECURITY DEFINER` Postgres functions (RPCs), not in application code, so it can't be bypassed by a browser client and stays consistent under concurrent votes (see §3).
- **Auth:** Supabase Auth (email magic link + Google OAuth). Voting and trade-viewing never require an account — auth only gates favorites, voting history, and (optionally in the future) trade authorship moderation.
- **Session identity:** an anonymous UUID in `localStorage` (`lib/session.ts`) travels with every vote/trade-vote so duplicate-matchup protection and rate limiting work without an account.
- **Why this stack:** Postgres RPCs give us atomic, race-safe rating updates and a hard security boundary (RLS) without standing up a separate backend service. Server Components keep rankings/player/trade pages fast and crawlable. This is the same shape you'd use whether you're seeding 300 players or 3,000.

```
Browser (Next.js Client Components)
  │  supabase-js (anon key)
  ▼
Supabase
  ├─ Postgres tables (players, player_ratings, votes, trades, trade_players, trade_votes, favourites, rate_limit_log)
  ├─ RPCs: cast_vote, next_matchup, cast_trade_vote, create_trade   (SECURITY DEFINER — only write path for ratings)
  ├─ RLS: public SELECT everywhere; no direct INSERT/UPDATE policies on player_ratings
  └─ Auth: email OTP + Google OAuth

Next.js Server Components (rankings, player profiles, trade feed, sitemap)
  │  supabase-js (anon key, SSR cookies via @supabase/ssr)
  ▼
Supabase (read-only queries)
```

---

## 2. Database schema

See `supabase/migrations/0001_init.sql` for the full DDL. Summary:

| Table | Purpose |
|---|---|
| `players` | Individual players + team D/ST entities. `position`, `nfl_team`, `bye_week`, `slug` (for `/players/[slug]`), `seed_rank_overall`/`seed_rank_position` (ADP at seed time, used for the "ADP Δ" movement column), `fantasy_relevant`/`active` flags. |
| `player_ratings` | One row per `(player_id, category)`. `rating` (Elo), `wins`, `losses`, `comparisons`, `last_compared_at`. Category is one of `overall, qb, rb, wr, te, k, dst`. |
| `votes` | Append-only log: `session_id`, optional `user_id`, `category`, `player_a_id`, `player_b_id`, `winner_id`. This is the audit trail ratings are derived from. |
| `trades` | A submitted trade: `format` (redraft/dynasty/keeper), `scoring` (standard/half_ppr/ppr), `league_size`, `superflex`. |
| `trade_players` | Player legs of a trade, tagged `side` A/B. |
| `trade_votes` | One row per `(trade_id, session_id)` — `team_a` / `fair` / `team_b`. |
| `favourites` | `(user_id, player_id)` — registered users only. |
| `rate_limit_log` | Rolling-window counters used by the RPCs; never exposed to clients. |

Indexes cover every hot path: rankings sort (`category, rating desc`), matchmaking (`category, comparisons`), duplicate-matchup lookups, and trade feed joins. Full RLS policies are in `supabase/migrations/0003_policies.sql` — public read everywhere, and **no** direct write policy on `player_ratings` at all, so the only way to move a rating is through `cast_vote()`.

---

## 3. Ranking algorithm

**Elo, not win-counting**, per the product principle: rankings reflect "who would fantasy players rather have," not raw win totals (a player who's been shown 500 times will out-total a player shown 20 times on wins alone; Elo normalizes for that).

- Every player has an **independent rating per category** — Overall and their position — seeded from the 2026 ADP import (`lib/elo.ts#seedRatingFromRank`, linear interpolation between 1850 at rank 1 and 1350 at the bottom of the pool).
- **K-factor scales down with experience** (`lib/elo.ts#kFactor`: 48 under 10 comparisons, 32 under 40, 20 after) — new players' ratings converge fast from thin data; established players don't get knocked around by one upset.
- **Beating a favorite is worth more** than beating a scrub — standard Elo expected-score math (`expectedScore`), exactly as specified.
- The reference implementation lives in `lib/elo.ts` (used by the seed script) and is mirrored inside the `cast_vote()` Postgres function in `supabase/migrations/0002_functions.sql` — that function is the one that actually runs in production, atomically, inside the same transaction as the vote insert. **If you tune the K-factor or formula, update both.**

**Matchmaking** (`next_matchup()` RPC, mirrored client-side in `lib/matchmaking.ts` as the documented reference): priority order is (1) similar rating, (2) not seen by this session in the last 3 hours, (3) fewer total comparisons (surfaces new/under-voted players), (4) a ~12% "calibration" chance of an intentionally wide rating gap. Overall voting is restricted to `QB/RB/WR/TE` — no kicker ever shows up against a first-round running back. Position categories only pair same-position players by construction.

---

## 3b. Vote-to-unlock tokens

Rankings and Trade Vote are gated behind a small token economy, so casual visitors are nudged into voting before they can browse: 1 token per vote cast (derived from the existing `votes` table by session — no separate ledger), and unlocking Rankings + Trades together costs **20 tokens** as one "site pass" (not 20 per section). Once a session spends, it stays unlocked for that browser going forward — it does not re-charge on every visit, which was a deliberate choice to avoid punishing repeat visitors; if you actually want a harsher "pay every visit" model, that's a straightforward change to `unlock_site()` in `supabase/migrations/0005_tokens.sql`.

**SEO-safe by design:** the gate is a soft, client-side overlay (`components/TokenGate.tsx`) — gated pages still render their real content server-side into the HTML (so Google indexing and link-preview scrapers see it), and only a signed-in browser without enough tokens sees it visually blurred behind an unlock prompt. This does mean a shared trade URL (`/trades/[id]`) shows the gate to a first-time visitor too, even though sharing trade links is otherwise a core feature — worth knowing if that friction doesn't feel right for that specific page.

`components/TokenBadge.tsx` shows the running balance in the nav; `get_token_status()`/`unlock_site()` (both `SECURITY DEFINER` RPCs, same pattern as the rest of the write path) are the only way a balance changes.

---

## 4. Page structure

```
/                       Home — hero, live embedded voting widget, top-6 overall rankings, position grid, trade CTA, how-it-works
/vote, /vote/[category] Pairwise voting screen (overall + 6 positions)
/rankings               Overall rankings, Top 25/50/All filter
/rankings/[category]    QB / RB / WR / TE / K / DST rankings
/players/[slug]         Player profile — Elo, rank, record, "most often beats" / "most often beaten by"
/trades                 Public trade feed — New / Most Voted / Most Controversial
/trades/new             Trade submission (player search, league context)
/trades/[id]            Single trade — shareable, voteable
/how-it-works           Product explainer
/auth/sign-in           Email magic link + Google
/profile                Voting/trade stats, favorites (auth required)
/sitemap.xml, /robots.txt   SEO
```

All of `/rankings*`, `/players/[slug]`, and `/trades*` are Server Components with real `<title>`/meta description/canonical/Open Graph tags and JSON-LD (`ItemList` on rankings, `Person` on player profiles) — see §8.

---

## 5. Component structure

```
components/
  Nav.tsx, BottomNav.tsx        desktop top nav / mobile bottom nav
  PlayerCard.tsx                 the tappable voting card (image, name, team, pos, bye, rank, exit animation)
  VoteArena.tsx                  the voting loop: fetch matchup → render two PlayerCards → cast_vote → next matchup
  CategoryTabs.tsx                Overall | QB | RB | WR | TE | K | D/ST, shared by /vote and /rankings
  RankingsTable.tsx, RankingsFilterBar.tsx
  PlayerSearch.tsx                autocomplete used by the trade builder
  TradeBuilder.tsx                two-sided player search + league context + submit
  TradeCard.tsx                   trade display + inline voting + share, used by both the feed and the detail page
  PlayerProfileTracker.tsx        fires the player_profile_viewed analytics event from a Server Component page
  Analytics.tsx                   GA4 script loader
lib/
  supabase/client.ts, server.ts   browser / SSR Supabase clients (+ admin client for the seed script)
  elo.ts                          rating math (reference implementation, mirrored in SQL)
  matchmaking.ts                  matchup selection (reference implementation, mirrored in SQL)
  session.ts                      anonymous session id + "seen pairs" tracking
  analytics.ts                    typed track() wrapper around gtag
  rankings.ts, trades.ts          server-side data fetchers used by the page components
  format.ts, database.types.ts    shared labels/formatters + hand-written schema types
```

---

## 6. How the player database is populated and kept current

**Seeding is a two-stage, file-based pipeline — never hand-typed into the frontend:**

1. `data/raw_adp_ppr.txt` — a plain-text export of current 2026 12-team PPR ADP (265 ranked entries, sourced from a live mock-draft aggregator; see the "Data refresh" note below for how to pull a fresh one). One line per player: `rank. Name - POS - TEAM`.
2. `scripts/build_seed.py` parses that file, fills in the handful of NFL defenses that mock-draft samples typically omit (kickers/DST go late and aren't always sampled), assigns slugs, bye weeks, and both **overall** rank (QB/RB/WR/TE only — K/DST never get an overall seed) and **position** rank, and writes `data/players_seed.json` (structured, used by the app) plus `supabase/seed/seed_players.sql` (a plain-SQL fallback you can paste into the Supabase SQL editor).
3. `npm run seed` (`scripts/seed.ts`) reads `players_seed.json` and upserts into Supabase using the service-role key — matched by `slug`, so it's **idempotent**: re-running after refreshing the source file adds new/changed players without ever overwriting a live community rating on an existing one.

As-delivered, this seeds **272 players**: 30 QB, 69 RB, 91 WR, 27 TE, 23 K, 32 DST — comfortably inside the spec's target ranges.

**To refresh later (e.g. weekly during the season, or before next year's draft season):**
- Replace `data/raw_adp_ppr.txt` with a new export in the same `rank. Name - POS - TEAM` format (FantasyPros, Sleeper, or any provider's ADP export works once reformatted this way), or
- Swap the source entirely: point `scripts/build_seed.py` at a real provider API (Sleeper's free players endpoint, SportsDataIO, MySportsFeeds, nflverse) instead of a text file — the JSON output contract (`SeedPlayer` shape in `scripts/seed.ts`) doesn't change, so nothing downstream needs to know the source changed.
- Run `python3 scripts/build_seed.py && npm run seed`.

**Known placeholder to swap before launch:** `headshot_url` is seeded `null` (the UI falls back to initials avatars) and `bye_week` uses an illustrative week-5–14 slotting rather than the league's official released schedule — both are called out with `TODO`-style comments at their source in `scripts/build_seed.py`. Wire up a real headshot CDN (ESPN, Sleeper) and the official bye-week schedule as part of the first real data refresh.

**Automated team/injury sync (`/api/sync-players`):** beyond the manual refresh above, `app/api/sync-players/route.ts` runs on a schedule (see `vercel.json` — daily by default, Vercel Cron) and pulls current team + injury status for every player from Sleeper's free public player directory (`api.sleeper.app/v1/players/nfl`, no key required). It matches players by normalized name + position (there's no shared ID between our database and Sleeper's), updates `team_abbreviation`/`nfl_team`/`injury_status` when they've changed, and reports anything it couldn't confidently match rather than guessing. This is the honest ceiling for "free and automatic" — same-day accuracy on trades/injuries, not real-time. For instant updates you'd need a paid, licensed sports-data feed (SportsDataIO, MySportsFeeds) — swapping the fetch in that route to a different source is a small, contained change.

To enable it: set a `CRON_SECRET` environment variable (any long random string — Vercel automatically sends it as a Bearer token to your own cron-triggered requests, which is what authorizes the route) and a `SUPABASE_SERVICE_ROLE_KEY` (from Supabase Settings → API Keys → Secret key; this route needs to bypass RLS to write player updates). You can also trigger it manually any time: `GET /api/sync-players?secret=<your CRON_SECRET>`.

---

## 7. Product risks

- **Vote manipulation / bots.** Anonymous voting is the whole point, but it's also the attack surface. Mitigated with: per-session duplicate-matchup blocking (12h), a 300-votes/10-min rate limit, and K-factor decay so a single burst of votes on a fresh matchup can't swing a rating far. **Not** mitigated: a determined attacker rotating `localStorage` sessions from one IP. If this becomes a real problem, add IP-based rate limiting at the edge (Vercel/Cloudflare) and consider a lightweight CAPTCHA or requiring auth past some vote-count threshold — the schema already has `user_id` on `votes` ready for that.
- **Cold-start rankings.** A freshly-seeded category has thin data; early votes will swing ratings hard (by design — that's what the higher K-factor at low comparison-counts is for) and the "ADP Δ" column will look noisy until each player has ~10+ votes. Consider seeding with a synthetic round of votes derived from ADP order itself, or just message "still calibrating" under ~10 comparisons.
- **Overall-category positional bias.** Restricting Overall to QB/RB/WR/TE avoids the "elite RB vs. kicker" problem, but it also means Overall is really "skill-position overall" — if users expect K/DST in there too, that's a product call to revisit, not a bug.
- **Trade Vote has no player-value guardrails.** Nothing stops someone submitting a joke or wildly lopsided trade — that's arguably fine (Fair Trade voting is the whole point), but the "Most Controversial" sort could get gamed by planting a fake close vote if trade-vote rate limiting is too loose. Current limit is 100 trade-votes/session/10 min; tune down if abused.
- **Headshots and bye weeks are placeholders**, called out above — shipping with `null` headshots is a real, visible gap, not a nice-to-have.
- **No moderation layer for trades or player data.** `trades.status` supports `open`/`closed` for a future "remove abusive trade" admin action, but there's no admin UI yet — that's a Phase 5 if this ships publicly.
- **Elo across categories isn't comparable.** A 1700 in the TE pool and a 1700 in the WR pool don't mean the same thing (different pool sizes, different vote volume) — don't be tempted to merge them into one number later without re-normalizing.

---

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL/anon key/service role key

# Apply the schema (Supabase CLI, or paste each file into the SQL editor in order)
supabase link --project-ref <your-project-ref>
supabase db push
# — or, in the Supabase dashboard SQL editor, run in order:
#   supabase/migrations/0001_init.sql
#   supabase/migrations/0002_functions.sql
#   supabase/migrations/0003_policies.sql

npm run seed        # seeds 272 players + initial Elo ratings
npm run dev          # http://localhost:3000
```

**Google Sign-In:** enable the Google provider in Supabase Auth settings and add your OAuth client ID/secret there — no code changes needed, `app/auth/sign-in/page.tsx` already calls `signInWithOAuth({ provider: 'google' })`.

**Analytics:** set `NEXT_PUBLIC_GA_MEASUREMENT_ID` to enable GA4. Events fired: `player_vote` (category, player_a, player_b, winner), `vote_category_selected`, `ranking_viewed`, `player_profile_viewed`, `trade_created`, `trade_vote`, `trade_shared`, `account_created` — see `lib/analytics.ts` for the typed event contract.

**Build:** `npm run build` succeeds even with no `.env.local` configured (data-fetching helpers detect missing credentials and render an empty state rather than throwing — see `isSupabaseConfigured()` in `lib/supabase/server.ts`), so CI/preview builds don't require a live database.

---

## What's implemented vs. what's next

**Done (Phases 1–4, as specified):** schema + RLS + RPCs, 272-player seed, pairwise voting with Elo + smart matchmaking, full rankings pages with Top 25/50/All and ADP-delta, player profiles with head-to-head breakdowns, trade submission/voting/feed/detail with shareable URLs, Supabase Auth (email + Google) with profile/favorites, GA4 event wiring, SEO (metadata, sitemap, robots, JSON-LD), rate limiting + duplicate-matchup protection.

**Deliberately left for you to wire up:** real headshot URLs and official bye weeks (see §6), an admin/moderation surface for trades, IP-level abuse detection (needs an edge/hosting-level integration, not just app code), and a "Save Favorite" button on the player profile page (the `favourites` table and RLS policy exist; the UI affordance doesn't yet).
