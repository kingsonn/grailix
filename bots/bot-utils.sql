-- Bot Management Utilities
-- Collection of useful SQL queries for managing bot accounts

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Count total bot users
SELECT COUNT(*) as total_bots 
FROM users 
WHERE credits_balance = 999;

-- View all bot users with their balances
SELECT 
  id,
  wallet_address,
  credits_balance,
  real_credits_balance,
  xp,
  streak,
  accuracy,
  created_at
FROM users 
WHERE credits_balance = 999
ORDER BY created_at DESC;

-- ============================================================
-- STATISTICS QUERIES
-- ============================================================

-- Bot stakes summary
SELECT 
  COUNT(*) as total_stakes,
  COUNT(DISTINCT user_id) as unique_bots,
  COUNT(DISTINCT prediction_id) as unique_predictions,
  SUM(stake_credits) as total_credits_staked,
  AVG(stake_credits) as avg_stake,
  MIN(stake_credits) as min_stake,
  MAX(stake_credits) as max_stake
FROM user_prediction_stakes
WHERE user_id IN (SELECT id FROM users WHERE credits_balance = 999);

-- Position distribution (YES vs NO)
SELECT 
  position,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM user_prediction_stakes
WHERE user_id IN (SELECT id FROM users WHERE credits_balance = 999)
GROUP BY position;

-- Stakes per prediction
SELECT 
  p.id,
  p.prediction_text,
  COUNT(ups.id) as bot_stakes,
  SUM(CASE WHEN ups.position = 'YES' THEN 1 ELSE 0 END) as yes_count,
  SUM(CASE WHEN ups.position = 'NO' THEN 1 ELSE 0 END) as no_count,
  SUM(ups.stake_credits) as total_staked
FROM predictions p
LEFT JOIN user_prediction_stakes ups ON p.id = ups.prediction_id
WHERE ups.user_id IN (SELECT id FROM users WHERE credits_balance = 999)
GROUP BY p.id, p.prediction_text
ORDER BY bot_stakes DESC;

-- Bot activity timeline
SELECT 
  DATE(ups.created_at) as date,
  COUNT(*) as stakes_count,
  SUM(ups.stake_credits) as credits_staked
FROM user_prediction_stakes ups
WHERE ups.user_id IN (SELECT id FROM users WHERE credits_balance = 999)
GROUP BY DATE(ups.created_at)
ORDER BY date DESC;

-- ============================================================
-- BALANCE QUERIES
-- ============================================================

-- Check remaining balances
SELECT 
  COUNT(*) as bot_count,
  AVG(real_credits_balance) as avg_balance,
  MIN(real_credits_balance) as min_balance,
  MAX(real_credits_balance) as max_balance,
  SUM(real_credits_balance) as total_balance
FROM users 
WHERE credits_balance = 999;

-- Bots with low balance (less than 1000)
SELECT 
  wallet_address,
  real_credits_balance
FROM users 
WHERE credits_balance = 999 
  AND real_credits_balance < 1000
ORDER BY real_credits_balance ASC;

-- ============================================================
-- DETAILED STAKE VIEWS
-- ============================================================

-- Recent bot stakes (last 100)
SELECT 
  u.wallet_address,
  p.prediction_text,
  ups.position,
  ups.stake_credits,
  ups.payout_credits,
  ups.created_at,
  ups.resolved_at
FROM user_prediction_stakes ups
JOIN users u ON ups.user_id = u.id
JOIN predictions p ON ups.prediction_id = p.id
WHERE u.credits_balance = 999
ORDER BY ups.created_at DESC
LIMIT 100;

-- Resolved bot stakes (with payouts)
SELECT 
  u.wallet_address,
  p.prediction_text,
  ups.position,
  ups.stake_credits,
  ups.payout_credits,
  (ups.payout_credits - ups.stake_credits) as profit_loss,
  p.outcome_value,
  ups.resolved_at
FROM user_prediction_stakes ups
JOIN users u ON ups.user_id = u.id
JOIN predictions p ON ups.prediction_id = p.id
WHERE u.credits_balance = 999
  AND ups.resolved_at IS NOT NULL
ORDER BY ups.resolved_at DESC;

-- Bot performance (win rate)
SELECT 
  u.wallet_address,
  COUNT(*) as total_resolved_stakes,
  SUM(CASE WHEN ups.payout_credits > ups.stake_credits THEN 1 ELSE 0 END) as wins,
  SUM(CASE WHEN ups.payout_credits < ups.stake_credits THEN 1 ELSE 0 END) as losses,
  ROUND(
    SUM(CASE WHEN ups.payout_credits > ups.stake_credits THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
    2
  ) as win_rate_percentage,
  SUM(ups.stake_credits) as total_staked,
  SUM(ups.payout_credits) as total_payout,
  SUM(ups.payout_credits - ups.stake_credits) as net_profit_loss
FROM user_prediction_stakes ups
JOIN users u ON ups.user_id = u.id
WHERE u.credits_balance = 999
  AND ups.resolved_at IS NOT NULL
GROUP BY u.id, u.wallet_address
ORDER BY net_profit_loss DESC;

-- ============================================================
-- CLEANUP QUERIES
-- ============================================================

-- Delete all bot stakes (WARNING: Destructive)
-- Uncomment to use:
-- DELETE FROM user_prediction_stakes
-- WHERE user_id IN (SELECT id FROM users WHERE credits_balance = 999);

-- Delete all bot users (WARNING: Destructive, cascades to stakes)
-- Uncomment to use:
-- DELETE FROM users WHERE credits_balance = 999;

-- Reset bot balances to initial state
-- Uncomment to use:
-- UPDATE users 
-- SET real_credits_balance = 10000 
-- WHERE credits_balance = 999;

-- Delete only unresolved bot stakes
-- Uncomment to use:
-- DELETE FROM user_prediction_stakes
-- WHERE user_id IN (SELECT id FROM users WHERE credits_balance = 999)
--   AND resolved_at IS NULL;

-- ============================================================
-- MAINTENANCE QUERIES
-- ============================================================

-- Find bots with no stakes
SELECT 
  u.id,
  u.wallet_address,
  u.real_credits_balance
FROM users u
LEFT JOIN user_prediction_stakes ups ON u.id = ups.user_id
WHERE u.credits_balance = 999
  AND ups.id IS NULL;

-- Find duplicate stakes (should be none)
SELECT 
  user_id,
  prediction_id,
  COUNT(*) as stake_count
FROM user_prediction_stakes
WHERE user_id IN (SELECT id FROM users WHERE credits_balance = 999)
GROUP BY user_id, prediction_id
HAVING COUNT(*) > 1;

-- Check for invalid stakes (negative amounts, etc.)
SELECT 
  ups.id,
  u.wallet_address,
  p.prediction_text,
  ups.stake_credits,
  ups.position
FROM user_prediction_stakes ups
JOIN users u ON ups.user_id = u.id
JOIN predictions p ON ups.prediction_id = p.id
WHERE u.credits_balance = 999
  AND (
    ups.stake_credits <= 0 
    OR ups.position NOT IN ('YES', 'NO')
  );

-- ============================================================
-- EXPORT QUERIES
-- ============================================================

-- Export bot data for analysis (CSV format)
-- Copy results to CSV for external analysis
SELECT 
  u.wallet_address,
  ups.prediction_id,
  p.prediction_text,
  ups.position,
  ups.stake_credits,
  ups.payout_credits,
  ups.created_at,
  ups.resolved_at,
  p.outcome_value
FROM user_prediction_stakes ups
JOIN users u ON ups.user_id = u.id
JOIN predictions p ON ups.prediction_id = p.id
WHERE u.credits_balance = 999
ORDER BY ups.created_at;
