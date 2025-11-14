System Architecture for Grailix
1. Frontend (Next.js 14)

Pages:

/ (Home)

/swipe

/wallet

/leaderboard

/profile

Core components:

PredictionCard

SentimentBar

StakeSelector

WalletConnectButton

2. Backend (Next.js API Routes)

Endpoints:

Predictions

GET /api/predictions/next → fetch next pending prediction

POST /api/predictions/stake → user stakes YES/NO/SKIP

User

GET /api/profile

Wallet

POST /api/wallet/deposit

POST /api/wallet/withdraw

Hash

POST /api/hash/prediction

POST /api/hash/outcome

Leaderboard

GET /api/leaderboard

3. Database (Supabase)

Tables:

users

predictions

user_prediction_stakes

prediction_pools

transactions

leaderboard_weekly

ai_raw_inputs

ai_normalized_predictions

4. Credits System
Type	Column	Usage
Trial credits	credits_balance	free-to-play
Crypto credits	real_credits_balance	based on deposit

All stakes deduct from relevant credit pool.

5. Swipe Workflow

GET next prediction

User stakes 10 credits (default)

Prediction sentiment updates

Stake record saved

New prediction shown

6. Resolution Workflow

Resolver agent finds expired predictions

Fetches price via API

Determines YES/NO outcome

Generates: outcomeHash

Updates DB

Payout winners using pari-mutuel formula

7. Hash Layer

predictionHash = keccak256(JSON of prediction metadata)
outcomeHash = keccak256(JSON of resolution metadata)

Both can be emitted to BNB testnet.