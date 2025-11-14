Grailix — API Contracts (Authoritative Specification)

All API endpoints MUST follow these contracts.
Responses MUST use { success, data, error } format.

🔷 1. GET /api/profile
Purpose:

Fetch user balances + XP + streak + accuracy.

Input:

Auth via connected wallet (passed in headers or query).

Output:
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "wallet_address": "0x123...",
      "credits_balance": 120,
      "real_credits_balance": 45,
      "xp": 1100,
      "streak": 4,
      "accuracy": 72.5
    }
  }
}

Errors:

User not found

DB error

🔷 2. GET /api/predictions/next
Purpose:

Return the next pending prediction that user hasn’t swiped.

Input:

user_wallet_address (query)

Output:
{
  "success": true,
  "data": {
    "prediction": {
      "id": 42,
      "prediction_text": "Bitcoin will reach $70k by Friday",
      "source_name": "AnalystXYZ",
      "source_category": "Bank",
      "asset": "BTCUSDT",
      "expiry_timestamp": "2025-01-15T10:00:00Z",
      "sentiment_yes": 120,
      "sentiment_no": 45
    }
  }
}

Errors:

No predictions available

DB fetch failure

🔷 3. POST /api/predictions/stake
Purpose:

Record user swipe (YES / NO / SKIP) and stake credits.

Input Body:
{
  "wallet_address": "0xabc",
  "prediction_id": 42,
  "position": "YES",
  "stake_credits": 10
}

Allowed positions: YES, NO, SKIP
Output:
{
  "success": true,
  "data": {
    "new_balance": 110,
    "updated_sentiment_yes": 121,
    "updated_sentiment_no": 45
  }
}

Errors:

Insufficient credits

Already swiped

Prediction expired

Bulk write failure

🔷 4. POST /api/wallet/deposit
Purpose:

Record deposit transaction from blockchain, credit user.

Input:
{
  "wallet_address": "0xabc",
  "amount": 50,
  "tx_hash": "0x123"
}

Output:
{
  "success": true,
  "data": { "real_credits_balance": 95 }
}

🔷 5. POST /api/wallet/withdraw
Purpose:

Reserve balance for withdraw request.

Input:
{
  "wallet_address": "0xabc",
  "amount": 20
}

Output:
{
  "success": true,
  "data": { "status": "pending" }
}

🔷 6. POST /api/hash/prediction
Input:
{
  "prediction_id": 42,
  "prediction_hash": "0xabc123"
}

🔷 7. POST /api/hash/outcome
Input:
{
  "prediction_id": 42,
  "outcome_hash": "0xdef456"
}

🔷 8. GET /api/leaderboard
Output:
{
  "success": true,
  "data": [
    { "wallet": "0x1", "xp": 1500, "streak": 7, "accuracy": 81.2 },
    { "wallet": "0x2", "xp": 1300, "streak": 5, "accuracy": 77.4 }
  ]
}
