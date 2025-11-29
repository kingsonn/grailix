# Optional Database Improvement

## Add Unique Constraint to prediction_pools

### Current Situation
The `prediction_pools` table doesn't have a unique constraint on `prediction_id`, which means:
- Multiple pool entries could exist for the same prediction (duplicates)
- Can't use `ON CONFLICT` in SQL for upsert operations
- Need to use DELETE + INSERT pattern in backfill script

### Recommended Improvement

Add a unique constraint to prevent duplicate pools:

```sql
-- Add unique constraint on prediction_id
ALTER TABLE prediction_pools 
ADD CONSTRAINT prediction_pools_prediction_id_unique 
UNIQUE (prediction_id);
```

### Benefits

1. **Data Integrity** - Prevents duplicate pool entries
2. **Better Performance** - Database can optimize queries with unique index
3. **Simpler Code** - Can use `ON CONFLICT` for upserts
4. **Cleaner Logic** - One pool per prediction guaranteed

### Before Running

Make sure there are no existing duplicates:

```sql
-- Check for duplicate pools
SELECT 
  prediction_id, 
  COUNT(*) as duplicate_count
FROM prediction_pools
GROUP BY prediction_id
HAVING COUNT(*) > 1;
```

If duplicates exist, clean them up first:

```sql
-- Keep only the most recent pool for each prediction
DELETE FROM prediction_pools
WHERE id NOT IN (
  SELECT MAX(id)
  FROM prediction_pools
  GROUP BY prediction_id
);
```

### After Adding Constraint

You could then simplify the backfill script to use:

```sql
INSERT INTO prediction_pools (prediction_id, total_yes, total_no, last_updated)
SELECT 
  ups.prediction_id,
  SUM(CASE WHEN ups.position = 'YES' THEN ups.stake_credits ELSE 0 END) as total_yes,
  SUM(CASE WHEN ups.position = 'NO' THEN ups.stake_credits ELSE 0 END) as total_no,
  NOW() as last_updated
FROM user_prediction_stakes ups
WHERE ups.user_id IN (SELECT id FROM users WHERE credits_balance = 999)
GROUP BY ups.prediction_id
ON CONFLICT (prediction_id) 
DO UPDATE SET
  total_yes = prediction_pools.total_yes + EXCLUDED.total_yes,
  total_no = prediction_pools.total_no + EXCLUDED.total_no,
  last_updated = NOW();
```

### Current Code Works Fine

**Note:** The current bot simulators already handle this gracefully by:
- Using `limit(1)` to get the first pool if duplicates exist
- Creating a new pool only if none exists
- Updating the existing pool otherwise

So this is **optional** - the system works correctly either way!

### When to Apply

- ✅ **Do it now** if you want cleaner database schema
- ✅ **Do it later** during a maintenance window
- ✅ **Skip it** if the current approach works for your needs

The bot system will work correctly regardless of whether you add this constraint.
