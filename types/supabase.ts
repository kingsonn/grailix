// Supabase Database Types
// Generated from schema in docs/06-database-schema.md

export interface User {
  id: string;
  wallet_address: string;
  credits_balance: number;
  real_credits_balance: number;
  xp: number;
  streak: number;
  accuracy: number;
  created_at: string;
  updated_at: string;
}

export interface Prediction {
  id: number;
  prediction_text: string;
  source_name?: string;
  source_category?: string;
  asset?: string;
  expiry_timestamp: string;
  created_timestamp: string;
  sentiment_yes: number;
  sentiment_no: number;
  prediction_hash?: string;
  outcome_hash?: string;
  status: "pending" | "resolved";
  outcome_value?: "YES" | "NO" | "EXACT_NUMBER";
  resolved_price?: number;
  resolved_timestamp?: string;
}

export interface UserPredictionStake {
  id: number;
  user_id: string;
  prediction_id: number;
  position: "YES" | "NO";
  stake_credits: number;
  payout_credits: number;
  created_at: string;
  resolved_at?: string;
}

export interface PredictionPool {
  id: number;
  prediction_id: number;
  total_yes: number;
  total_no: number;
  last_updated: string;
}

export interface Transaction {
  id: number;
  user_id: string;
  type: "deposit" | "withdraw";
  amount: number;
  tx_hash?: string;
  status: "pending" | "confirmed" | "failed";
  created_at: string;
}

export interface LeaderboardWeekly {
  id: number;
  user_id: string;
  xp: number;
  streak: number;
  accuracy: number;
  week_start: string;
}

export interface AIRawInput {
  id: number;
  raw_text: string;
  source_url?: string;
  source_name?: string;
  fetched_at: string;
}

export interface AINormalizedPrediction {
  id: number;
  raw_id: number;
  normalized_prediction_text: string;
  asset?: string;
  direction?: string;
  target_value?: number;
  expiry_timestamp: string;
  source_name?: string;
  reason_validated?: string;
  is_valid: boolean;
  created_at: string;
}
