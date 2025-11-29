-- Backfill Script for prediction_pools and predictions sentiment
-- This script calculates and updates the missing data from existing bot stakes
--
-- NOTE: The prediction_pools table doesn't have a unique constraint on prediction_id,
-- so we use DELETE + INSERT instead of ON CONFLICT to avoid duplicates.

-- ============================================================
-- STEP 1: Create or update prediction_pools from existing stakes
-- ============================================================

-- First, let's see what we're working with
SELECT 
  'Existing bot stakes' as info,
  COUNT(*) as count
FROM user_prediction_stakes ups
WHERE ups.user_id IN (SELECT id FROM users WHERE credits_balance = 999);

-- Insert or update prediction_pools based on existing stakes
-- Using a different approach since there's no unique constraint on prediction_id

-- First, delete existing pools for bot-affected predictions to avoid duplicates
DELETE FROM prediction_pools
WHERE prediction_id IN (
  SELECT DISTINCT prediction_id 
  FROM user_prediction_stakes 
  WHERE user_id IN (SELECT id FROM users WHERE credits_balance = 999)
);

-- Now insert fresh data
INSERT INTO prediction_pools (prediction_id, total_yes, total_no, last_updated)
SELECT 
  ups.prediction_id,
  SUM(CASE WHEN ups.position = 'YES' THEN ups.stake_credits ELSE 0 END) as total_yes,
  SUM(CASE WHEN ups.position = 'NO' THEN ups.stake_credits ELSE 0 END) as total_no,
  NOW() as last_updated
FROM user_prediction_stakes ups
WHERE ups.user_id IN (SELECT id FROM users WHERE credits_balance = 999)
GROUP BY ups.prediction_id;

-- Verify prediction_pools update
SELECT 
  'Updated prediction_pools' as info,
  COUNT(*) as pools_count,
  SUM(total_yes) as total_yes_credits,
  SUM(total_no) as total_no_credits
FROM prediction_pools;

-- ============================================================
-- STEP 2: Update predictions table sentiment counts
-- ============================================================

-- Update sentiment_yes and sentiment_no in predictions table
UPDATE predictions p
SET 
  sentiment_yes = sentiment_yes + COALESCE(stake_counts.yes_count, 0),
  sentiment_no = sentiment_no + COALESCE(stake_counts.no_count, 0)
FROM (
  SELECT 
    ups.prediction_id,
    SUM(CASE WHEN ups.position = 'YES' THEN 1 ELSE 0 END) as yes_count,
    SUM(CASE WHEN ups.position = 'NO' THEN 1 ELSE 0 END) as no_count
  FROM user_prediction_stakes ups
  WHERE ups.user_id IN (SELECT id FROM users WHERE credits_balance = 999)
  GROUP BY ups.prediction_id
) as stake_counts
WHERE p.id = stake_counts.prediction_id;

-- Verify predictions sentiment update
SELECT 
  'Updated predictions sentiment' as info,
  COUNT(*) as predictions_count,
  SUM(sentiment_yes) as total_yes_votes,
  SUM(sentiment_no) as total_no_votes
FROM predictions
WHERE id IN (
  SELECT DISTINCT prediction_id 
  FROM user_prediction_stakes 
  WHERE user_id IN (SELECT id FROM users WHERE credits_balance = 999)
);

-- ============================================================
-- STEP 3: Detailed verification
-- ============================================================

-- Show detailed breakdown per prediction
SELECT 
  p.id,
  p.prediction_text,
  p.sentiment_yes,
  p.sentiment_no,
  pp.total_yes,
  pp.total_no,
  (SELECT COUNT(*) FROM user_prediction_stakes ups 
   WHERE ups.prediction_id = p.id 
   AND ups.user_id IN (SELECT id FROM users WHERE credits_balance = 999)
   AND ups.position = 'YES') as bot_yes_stakes,
  (SELECT COUNT(*) FROM user_prediction_stakes ups 
   WHERE ups.prediction_id = p.id 
   AND ups.user_id IN (SELECT id FROM users WHERE credits_balance = 999)
   AND ups.position = 'NO') as bot_no_stakes
FROM predictions p
LEFT JOIN prediction_pools pp ON p.id = pp.prediction_id
WHERE p.id IN (
  SELECT DISTINCT prediction_id 
  FROM user_prediction_stakes 
  WHERE user_id IN (SELECT id FROM users WHERE credits_balance = 999)
)
ORDER BY p.id;

-- ============================================================
-- STEP 4: Summary statistics
-- ============================================================

SELECT 
  '=== BACKFILL SUMMARY ===' as summary;

SELECT 
  'Bot Stakes' as metric,
  COUNT(*) as count,
  SUM(stake_credits) as total_credits
FROM user_prediction_stakes
WHERE user_id IN (SELECT id FROM users WHERE credits_balance = 999)
UNION ALL
SELECT 
  'Predictions Affected' as metric,
  COUNT(DISTINCT prediction_id) as count,
  NULL as total_credits
FROM user_prediction_stakes
WHERE user_id IN (SELECT id FROM users WHERE credits_balance = 999)
UNION ALL
SELECT 
  'Prediction Pools Created/Updated' as metric,
  COUNT(*) as count,
  NULL as total_credits
FROM prediction_pools
WHERE prediction_id IN (
  SELECT DISTINCT prediction_id 
  FROM user_prediction_stakes 
  WHERE user_id IN (SELECT id FROM users WHERE credits_balance = 999)
);

-- ============================================================
-- OPTIONAL: If you need to reset and start over
-- ============================================================

-- CAUTION: Only run these if you want to completely reset the backfill

-- Reset prediction_pools (removes all pool data for bot-affected predictions)
-- Uncomment to use:
/*
DELETE FROM prediction_pools
WHERE prediction_id IN (
  SELECT DISTINCT prediction_id 
  FROM user_prediction_stakes 
  WHERE user_id IN (SELECT id FROM users WHERE credits_balance = 999)
);
*/

-- Reset predictions sentiment (only for bot-affected predictions)
-- Uncomment to use:
/*
UPDATE predictions p
SET 
  sentiment_yes = sentiment_yes - COALESCE(stake_counts.yes_count, 0),
  sentiment_no = sentiment_no - COALESCE(stake_counts.no_count, 0)
FROM (
  SELECT 
    ups.prediction_id,
    SUM(CASE WHEN ups.position = 'YES' THEN 1 ELSE 0 END) as yes_count,
    SUM(CASE WHEN ups.position = 'NO' THEN 1 ELSE 0 END) as no_count
  FROM user_prediction_stakes ups
  WHERE ups.user_id IN (SELECT id FROM users WHERE credits_balance = 999)
  GROUP BY ups.prediction_id
) as stake_counts
WHERE p.id = stake_counts.prediction_id;
*/
