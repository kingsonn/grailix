# Bot System Documentation

This folder contains tools to create and manage fake bot accounts for platform engagement testing.

## Overview

The bot system consists of two main components:

1. **SQL Script** - Creates 50 fake user accounts
2. **TypeScript Bot** - Simulates predictions from these accounts

## Features

### Fake Users
- 50 unique bot accounts with realistic Ethereum-style wallet addresses
- Each bot has:
  - `real_credits_balance`: 10,000 (for placing stakes)
  - `credits_balance`: 999 (identifier for bot accounts)
  - Zero XP, streak, and accuracy (fresh accounts)

### Bot Simulation
- Automatically fetches all active predictions
- Each bot randomly picks YES or NO on every prediction
- Random stake amounts (10-100 credits) for realistic variety
- Duplicate prevention (won't stake twice on same prediction)
- **Automatically updates prediction_pools table** with total YES/NO stakes
- **Automatically updates predictions sentiment_yes/sentiment_no counts**
- Detailed logging and statistics
- Small delays to avoid database overload

## Setup Instructions

### Step 1: Insert Fake Users

Run the SQL script to create 50 bot accounts:

```sql
-- Execute in your Supabase SQL editor or psql
\i bots/insert-fake-users.sql
```

Or copy-paste the contents of `insert-fake-users.sql` into your database client.

**Verification:**
```sql
SELECT COUNT(*) FROM users WHERE credits_balance = 999;
-- Should return 50
```

### Step 2: Run Bot Simulation

Execute the TypeScript bot to simulate predictions:

```bash
npm run bot:simulate
```

### Step 3: Backfill Data (If Needed)

If you ran the simulation before the prediction_pools/sentiment updates were added, use the backfill script:

```sql
-- Execute in your Supabase SQL editor
\i bots/backfill-pools-and-sentiment.sql
```

This will:
- Calculate totals from existing bot stakes
- Create/update prediction_pools entries
- Update sentiment_yes and sentiment_no in predictions table
- Provide detailed verification and statistics

## Usage

### Running the Bot

```bash
# Simulate bot predictions on all active predictions
npm run bot:simulate
```

### Identifying Bot Accounts

Bot accounts can be identified by:
- `credits_balance = 999` (unique identifier)
- `real_credits_balance = 10000` (initial balance)

Query to find all bots:
```sql
SELECT id, wallet_address, real_credits_balance 
FROM users 
WHERE credits_balance = 999;
```

### Viewing Bot Stakes

```sql
SELECT 
  u.wallet_address,
  p.prediction_text,
  ups.position,
  ups.stake_credits,
  ups.created_at
FROM user_prediction_stakes ups
JOIN users u ON ups.user_id = u.id
JOIN predictions p ON ups.prediction_id = p.id
WHERE u.credits_balance = 999
ORDER BY ups.created_at DESC;
```

## Output Example

When running the bot simulation, you'll see:

```
🤖 Starting bot prediction simulation...

📥 Fetching bot users...
✅ Found 50 bot users
📥 Fetching active predictions...
✅ Found 15 active predictions

🎯 Simulating stakes for 50 bots on 15 predictions...

[1/50] Processing bot: 0x1a2b3c4d...
  ✅ Prediction #1: YES with 45 credits
  ✅ Prediction #2: NO with 78 credits
  ...

============================================================
📊 SIMULATION SUMMARY
============================================================
Total stake attempts:     750
✅ Successful stakes:     750
⏭️  Skipped (duplicates):  0
❌ Failed stakes:         0
============================================================

📈 POSITION DISTRIBUTION
============================================================
YES positions: 382 (50.9%)
NO positions:  368 (49.1%)
============================================================

💰 CREDITS STAKED
============================================================
Total credits staked: 41,250
Average per stake:    55.00
============================================================

✨ Bot simulation completed!
```

## Advanced Usage

### Customizing Stake Amounts

Edit `simulate-bot-predictions.ts` and modify the `getRandomStake()` function:

```typescript
function getRandomStake(min: number = 10, max: number = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
```

### Adjusting Position Probability

To bias towards YES or NO, modify `getRandomPosition()`:

```typescript
// 70% YES, 30% NO
function getRandomPosition(): "YES" | "NO" {
  return Math.random() > 0.3 ? "YES" : "NO";
}
```

### Running on Specific Predictions

Modify the `fetchActivePredictions()` function to filter by specific criteria:

```typescript
const { data, error } = await supabase
  .from("predictions")
  .select("id, prediction_text, expiry_timestamp, sentiment_yes, sentiment_no")
  .eq("status", "pending")
  .gt("expiry_timestamp", now)
  .eq("asset_type", "crypto") // Only crypto predictions
  .limit(10); // Only first 10 predictions
```

## Cleanup

### Remove All Bot Stakes

```sql
DELETE FROM user_prediction_stakes
WHERE user_id IN (
  SELECT id FROM users WHERE credits_balance = 999
);
```

### Remove All Bot Users

```sql
-- This will cascade delete all their stakes
DELETE FROM users WHERE credits_balance = 999;
```

### Reset Bot Balances

```sql
UPDATE users 
SET real_credits_balance = 10000 
WHERE credits_balance = 999;
```

## Troubleshooting

### No bot users found
- Make sure you've run `insert-fake-users.sql`
- Verify with: `SELECT COUNT(*) FROM users WHERE credits_balance = 999;`

### No active predictions found
- Check if there are pending predictions: `SELECT * FROM predictions WHERE status = 'pending';`
- Ensure predictions haven't expired: `SELECT * FROM predictions WHERE expiry_timestamp > NOW();`

### Database connection errors
- Verify `.env` file has correct Supabase credentials
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_SERVICE_KEY`

### Duplicate stake errors
- This is normal if you run the bot multiple times
- The bot automatically skips existing stakes
- To reset, delete stakes and re-run

## Best Practices

1. **Test on staging first** - Don't run on production without testing
2. **Monitor database load** - The script includes delays, but watch your database
3. **Check balances** - Ensure bots have sufficient `real_credits_balance`
4. **Review results** - Check the summary statistics after each run
5. **Clean up regularly** - Remove old bot data to keep database clean

## Future Improvements

Potential enhancements:
- Add time-based simulation (spread stakes over time)
- Implement bot "personalities" (aggressive, conservative, etc.)
- Add machine learning to make predictions more realistic
- Create API endpoint to trigger bot simulation
- Add webhook support for automatic bot actions
- Implement bot performance tracking and analytics

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the console output for error messages
3. Verify database schema matches expected structure
4. Check Supabase logs for detailed error information
