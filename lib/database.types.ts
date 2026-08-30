// Hand-written mirror of the Supabase schema (supabase/migrations/0001_init.sql).
// If you change the schema, regenerate with:
//   npx supabase gen types typescript --project-id <id> > lib/database.types.ts

export type Category = 'overall' | 'qb' | 'rb' | 'wr' | 'te' | 'k' | 'dst';
export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';
export type TradeFormat = 'redraft' | 'dynasty' | 'keeper';
export type TradeScoring = 'standard' | 'half_ppr' | 'ppr';
export type LeagueSize = '8' | '10' | '12' | '14+';
export type TradeVoteChoice = 'team_a' | 'fair' | 'team_b';
export type TradeStatus = 'open' | 'closed';
export type TradeSide = 'A' | 'B';

export interface PlayerRow {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  position: Position;
  nfl_team: string;
  team_abbreviation: string;
  bye_week: number | null;
  headshot_url: string | null;
  active: boolean;
  fantasy_relevant: boolean;
  slug: string;
  /** Free-text status from the automated sync (Questionable/Out/IR/etc), null = healthy. See app/api/sync-players/route.ts. */
  injury_status: string | null;
  /** NFL jersey number, kept in sync from Sleeper. Null until the first sync after a player is seeded. */
  jersey_number: number | null;
  seed_rank_overall: number | null;
  seed_rank_position: number | null;
  created_at: string;
  updated_at: string;
}

export interface PlayerRatingRow {
  player_id: string;
  category: Category;
  rating: number;
  wins: number;
  losses: number;
  comparisons: number;
  last_compared_at: string | null;
  updated_at: string;
}

export interface VoteRow {
  id: string;
  session_id: string;
  user_id: string | null;
  category: Category;
  player_a_id: string;
  player_b_id: string;
  winner_id: string;
  created_at: string;
}

export interface TradeRow {
  id: string;
  user_id: string | null;
  session_id: string;
  title: string | null;
  format: TradeFormat;
  scoring: TradeScoring;
  league_size: LeagueSize;
  superflex: boolean;
  status: TradeStatus;
  created_at: string;
}

export interface TradePlayerRow {
  id: string;
  trade_id: string;
  side: TradeSide;
  player_id: string;
}

export interface TradeVoteRow {
  id: string;
  trade_id: string;
  session_id: string;
  user_id: string | null;
  vote: TradeVoteChoice;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      players: { Row: PlayerRow; Insert: Partial<PlayerRow>; Update: Partial<PlayerRow> };
      player_ratings: { Row: PlayerRatingRow; Insert: Partial<PlayerRatingRow>; Update: Partial<PlayerRatingRow> };
      votes: { Row: VoteRow; Insert: Partial<VoteRow>; Update: Partial<VoteRow> };
      trades: { Row: TradeRow; Insert: Partial<TradeRow>; Update: Partial<TradeRow> };
      trade_players: { Row: TradePlayerRow; Insert: Partial<TradePlayerRow>; Update: Partial<TradePlayerRow> };
      trade_votes: { Row: TradeVoteRow; Insert: Partial<TradeVoteRow>; Update: Partial<TradeVoteRow> };
    };
    Views: Record<string, never>;
    Functions: {
      cast_vote: {
        Args: {
          p_session_id: string;
          p_category: Category;
          p_player_a_id: string;
          p_player_b_id: string;
          p_winner_id: string;
        };
        Returns: { player_a_rating: number; player_b_rating: number };
      };
      cast_trade_vote: {
        Args: { p_trade_id: string; p_session_id: string; p_vote: TradeVoteChoice };
        Returns: undefined;
      };
      next_matchup: {
        Args: { p_category: Category; p_session_id: string };
        Returns: { player_a: string; player_b: string };
      };
      get_matchup_consensus: {
        Args: { p_category: Category; p_player_a_id: string; p_player_b_id: string };
        Returns: { player_id: string; vote_count: number }[];
      };
    };
  };
}
