Grailix — Data Flow (MVP)
🔷 1. Signup / Login flow
WalletConnect → /api/profile → create user if missing → return balances

🔷 2. Swipe Cycle Flow
User opens /swipe
       ↓
GET /api/predictions/next
       ↓
Display PredictionCard
       ↓
User swipes (YES/NO/SKIP)
       ↓
POST /api/predictions/stake
       ↓
Update:
  - user_prediction_stakes
  - prediction_pools
  - predictions.sentiment_yes/no
  - users.credits_balance (deduct)
       ↓
UI loads next prediction

🔷 3. Resolution Flow
resolver.ts (cron)
      ↓
Fetch expired predictions
      ↓
Fetch live price (Binance API)
      ↓
Determine YES/NO outcome
      ↓
Compute payout using:
  prediction_pools.total_yes
  prediction_pools.total_no
      ↓
Update:
  predictions.status = 'resolved'
  predictions.outcome_value
  predictions.resolved_price
      ↓
Credit winners:
  user_prediction_stakes.payout_credits
  users.real_credits_balance += amount
      ↓
Generate outcomeHash
      ↓
POST /api/hash/outcome
      ↓
Emit contract event

🔷 4. AI Ingestion Flow
miner.ts → ai_raw_inputs
        ↓
validator.ts → ai_normalized_predictions
        ↓
admin ingestion → predictions
        ↓
predictionHash → /api/hash/prediction