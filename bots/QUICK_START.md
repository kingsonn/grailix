# Bot System - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Create Bot Accounts (One-time setup)

Run the SQL script in your Supabase SQL Editor:

```sql
-- Copy and paste contents of insert-fake-users.sql
-- Or run directly if you have psql access
```

**Verify:**
```sql
SELECT COUNT(*) FROM users WHERE credits_balance = 999;
-- Should return: 50
```

### Step 2: Run Basic Simulation

```bash
npm run bot:simulate
```

This will make all 50 bots place random YES/NO predictions on all active predictions.
**Note:** The simulator automatically updates `prediction_pools` and `predictions` sentiment counts.

### Step 3: Backfill Data (If you already ran simulation before)

If you ran the simulation before these updates, run the backfill script:

```sql
-- Copy and paste contents of backfill-pools-and-sentiment.sql
-- into your Supabase SQL Editor
```

### Step 4: Run Advanced Simulation (Optional)

```bash
npm run bot:advanced
```

This uses bot personalities and sentiment-aware positioning for more realistic behavior.

---

## 📋 What You Get

### Files Created

```
bots/
├── insert-fake-users.sql              # SQL to create 50 bot accounts
├── simulate-bot-predictions.ts        # Basic bot simulator
├── advanced-bot-simulator.ts          # Advanced simulator with personalities
├── backfill-pools-and-sentiment.sql   # Fix missing pool/sentiment data
├── bot-utils.sql                      # Useful SQL queries for management
├── README.md                          # Full documentation
└── QUICK_START.md                     # This file
```

### Bot Account Details

- **Count:** 50 bots
- **Identifier:** `credits_balance = 999`
- **Starting Balance:** `real_credits_balance = 10000`
- **Wallet Addresses:** Realistic Ethereum-style (0x...)

---

## 🎮 Common Commands

```bash
# Basic simulation (all bots, all predictions)
npm run bot:simulate

# Advanced simulation (personalities, sentiment-aware)
npm run bot:advanced
```

---

## 📊 Quick SQL Queries

### View All Bots
```sql
SELECT * FROM users WHERE credits_balance = 999;
```

### View Bot Stakes
```sql
SELECT 
  u.wallet_address,
  p.prediction_text,
  ups.position,
  ups.stake_credits
FROM user_prediction_stakes ups
JOIN users u ON ups.user_id = u.id
JOIN predictions p ON ups.prediction_id = p.id
WHERE u.credits_balance = 999
ORDER BY ups.created_at DESC
LIMIT 20;
```

### Bot Statistics
```sql
SELECT 
  COUNT(*) as total_stakes,
  SUM(stake_credits) as total_credits,
  AVG(stake_credits) as avg_stake
FROM user_prediction_stakes
WHERE user_id IN (SELECT id FROM users WHERE credits_balance = 999);
```

### Delete All Bot Stakes
```sql
DELETE FROM user_prediction_stakes
WHERE user_id IN (SELECT id FROM users WHERE credits_balance = 999);
```

---

## 🔍 Troubleshooting

### "No bot users found"
→ Run `insert-fake-users.sql` first

### "No active predictions found"
→ Create some predictions with future expiry dates

### "Already staked" messages
→ Normal if running multiple times. Bots skip duplicates automatically.

### Database connection errors
→ Check `.env` file has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_SERVICE_KEY`

---

## 💡 Tips

1. **First Time:** Run basic simulator to test everything works
2. **Production:** Use advanced simulator for more realistic engagement
3. **Testing:** Check bot-utils.sql for helpful queries
4. **Cleanup:** Delete stakes between test runs if needed

---

## 📖 Need More Info?

- **Full Documentation:** See `README.md`
- **SQL Utilities:** See `bot-utils.sql`
- **Code Details:** Check the TypeScript files

---

## ⚡ Example Workflow

```bash
# 1. First time setup - create bots
# Run insert-fake-users.sql in Supabase

# 2. Verify bots created
# SELECT COUNT(*) FROM users WHERE credits_balance = 999;

# 3. Run simulation
npm run bot:simulate

# 4. Check results
# Use queries from bot-utils.sql

# 5. Clean up if needed (optional)
# DELETE FROM user_prediction_stakes WHERE user_id IN (SELECT id FROM users WHERE credits_balance = 999);

# 6. Run again with different strategy
npm run bot:advanced
```

---

## 🎯 What Each Simulator Does

### Basic Simulator (`bot:simulate`)
- ✅ All bots participate
- ✅ Random YES/NO (50/50 split)
- ✅ Random stakes (10-100 credits)
- ✅ Fast execution
- ✅ Simple and predictable

### Advanced Simulator (`bot:advanced`)
- ✅ Variable participation (70-95% of bots)
- ✅ Sentiment-aware positioning
- ✅ Bot personalities (conservative, balanced, aggressive)
- ✅ Time-delayed stakes
- ✅ More realistic behavior

---

## 🛡️ Safety Notes

- Bots are identified by `credits_balance = 999` - don't change this!
- Always test on staging/development first
- Monitor database performance during large simulations
- Keep bot balances topped up for continued operation

---

**Ready to go? Run `npm run bot:simulate` to start!** 🚀
