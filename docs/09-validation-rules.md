Grailix — Validation Rules
🔶 1. Swipe Validation

User cannot stake twice on the same prediction

Stake must be integer ≥ 1

Prediction must be pending

Prediction must not be expired

User must have enough credits

Skip does NOT deduct credits

🔶 2. Wallet Validation

deposit.amount > 0

withdraw.amount > 0

withdraw.amount <= user.real_credits_balance

tx_hash must be provided in deposit

Transaction cannot be double-counted

🔶 3. Resolution Validation

prediction.expiry_timestamp <= now()

If both pools are zero → no payout

If one pool zero → winners get full 100%

Price fetch must be reliable; retry 3 times

If outcome computed, do not recompute

🔶 4. AI Validation Rules

Prediction must include asset + numeric target + timeframe

Reject vague predictions

normalized_prediction_text must be paraphrased

No copyrighted text stored as-is