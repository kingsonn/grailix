Grailix — Smart Contract Architecture

Grailix MVP uses two simple smart contracts deployed on BNB Testnet:

🔶 1. MockUSDC (ERC20)

Purpose:

Provide a stable token for deposits during MVP

Acts like real USDC but simplified

Requirements:

Standard ERC20 with 18 decimals

Mintable by owner (for testing)

Functions needed:

mint(address to, uint256 amount)

🔶 2. GrailixVault Contract

This is the main on-chain component.

Purpose

Users deposit MockUSDC → credited inside DB as real_credits_balance

Withdrawals are executed by backend calling the contract

predictionHash + outcomeHash events are emitted to blockchain

Contract stores ONLY event logs — NOT balances

DB acts as the ledger for balances
(This makes MVP simple, gas-cheap, and fast.)

Vault Contract Requirements
STATE VARIABLES

None needed for MVP
(we are not storing balances on-chain)

EVENTS

Emit events for:

event Deposited(address indexed user, uint256 amount, string internalDepositId);

event WithdrawRequested(address indexed user, uint256 amount, string internalWithdrawId);

event PredictionHashStored(uint256 predictionId, bytes32 predictionHash);

event OutcomeHashStored(uint256 predictionId, bytes32 outcomeHash);


The internalDepositId/internalWithdrawId allow backend → blockchain auditing.

FUNCTIONS
1. deposit(uint256 amount, string internalDepositId)

User approves Vault

Vault pulls MockUSDC from wallet using transferFrom

Emits Deposited

2. withdraw(address user, uint256 amount, string internalWithdrawId)

Only backend (owner) can trigger

Vault sends the MockUSDC back to the user

Emits WithdrawRequested

3. storePredictionHash(uint256 predictionId, bytes32 hash)

Emits PredictionHashStored

4. storeOutcomeHash(uint256 predictionId, bytes32 hash)

Emits OutcomeHashStored

⭐ Why this contract architecture works

Dead simple

Minimizes gas

Avoids building a full on-chain prediction AMM

Perfectly aligns with Grailix MVP

BNB judges will appreciate real utility + lightweight contracts

Easy to integrate via viem/wagmi