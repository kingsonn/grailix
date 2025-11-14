Grailix — On-Chain Interaction Specification

This doc defines exactly how the frontend, backend, and contracts talk.

🔷 1. DEPOSIT FLOW
User wallet → approve(MockUSDC, Vault)
User → Vault.deposit(amount, internalDepositId)
Contract → emits Deposited(user, amount)
Backend → detects tx
Backend → writes transaction row (confirmed)
Backend → increases user.real_credits_balance

🔷 2. WITHDRAW FLOW
User → POST /api/wallet/withdraw
Backend → checks balance
Backend → reserves real_credits_balance
Backend → calls Vault.withdraw(user, amount, internalWithdrawId)
Contract → emits WithdrawRequested

🔷 3. PREDICTION HASH FLOW
API /api/hash/prediction → calls contract.storePredictionHash()
Contract emits PredictionHashStored(predictionId, hash)
DB saves prediction_hash

🔷 4. OUTCOME HASH FLOW
resolver.ts computes outcome
API /api/hash/outcome → storeOutcomeHash()
Contract emits OutcomeHashStored(predictionId, outcomeHash)
DB saves outcome_hash

🔷 5. FRONTEND → BACKEND → CHAIN INTEGRATION

Frontend:

uses viem/wagmi for deposit transactions
Backend:

uses ethers.js for calling withdraw + hash functions

🔷 6. WHAT IS NOT ON-CHAIN (IMPORTANT)

These are NOT stored on-chain in MVP:

user balances

prediction text

pools

stakes

xp/streak
→ All remain in Supabase for simplicity.

Only hashes + deposit/withdraw events are on-chain.