# Grailix - AI-Powered Financial Prediction Skill Game

A Web3-powered swipe-based prediction market game built with Next.js, TypeScript, and Supabase.

## Project Structure

```
/grailix
├── /agents              # Background agents for AI processing and resolution
│   ├── miner.ts        # Fetches raw prediction data
│   ├── validator.ts    # Validates and normalizes predictions
│   ├── resolver.ts     # Resolves expired predictions
│   └── integrity.ts    # Verifies hash integrity
├── /app                # Next.js App Router pages
│   ├── layout.tsx      # Root layout with providers
│   ├── page.tsx        # Home page
│   ├── /swipe          # Prediction swiping interface
│   ├── /wallet         # Deposit/withdraw interface
│   ├── /leaderboard    # Top users by XP
│   └── /profile        # User stats and history
├── /components         # React components
│   ├── PredictionCard.tsx
│   ├── SentimentBar.tsx
│   ├── StakeSelector.tsx
│   └── WalletConnectButton.tsx
├── /lib                # Utility libraries
│   ├── supabaseClient.ts  # Supabase configuration
│   ├── contract.ts        # Wagmi + contract ABIs
│   ├── hashUtils.ts       # Hash generation utilities
│   └── fetchPrice.ts      # Price fetching from Binance
├── /pages/api          # API routes
│   ├── profile.ts
│   ├── leaderboard.ts
│   ├── /predictions
│   │   ├── next.ts
│   │   └── stake.ts
│   ├── /wallet
│   │   ├── deposit.ts
│   │   └── withdraw.ts
│   └── /hash
│       ├── prediction.ts
│       └── outcome.ts
├── /types              # TypeScript type definitions
│   └── supabase.ts     # Database types
├── /docs               # Project documentation
└── /contracts          # Smart contracts (Solidity)
    ├── MockUSDC.sol
    └── GrailixVault.sol
```

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS
- **Web3**: Wagmi, Viem, RainbowKit
- **Database**: Supabase (PostgreSQL)
- **Blockchain**: BNB Testnet
- **APIs**: Binance (price data), Supabase (backend)

## Smart Contracts (BNB Testnet)

- **MockUSDC**: `0x191C4781125f6aAB5203618637c69b22c914fa38`
- **GrailixVault**: `0x88B20685C92aebd53AB5351c95d25b8f300118C2`

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
NEXT_PUBLIC_CHAIN_ID=97
NEXT_PUBLIC_VAULT_ADDRESS=0x88B20685C92aebd53AB5351c95d25b8f300118C2
NEXT_PUBLIC_TOKEN_ADDRESS=0x191C4781125f6aAB5203618637c69b22c914fa38
PRIVATE_KEY=your_backend_wallet_private_key
```

### 3. Database Setup

The database schema is already created in Supabase. Refer to `/docs/06-database-schema.md` for the complete schema.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Status

### ✅ Completed (Phase 1 - Initialization)

- [x] Project structure created
- [x] Configuration files set up
- [x] Wagmi + RainbowKit integration
- [x] Supabase client configured
- [x] Component scaffolding
- [x] Page scaffolding
- [x] API route scaffolding
- [x] Agent file scaffolding
- [x] TypeScript types defined

### 🚧 TODO (Next Phases)

- [ ] Implement wallet authentication flow
- [ ] Implement prediction fetching logic
- [ ] Implement stake/swipe logic
- [ ] Implement deposit/withdraw functionality
- [ ] Implement resolution engine
- [ ] Implement payout calculations
- [ ] Implement XP/streak/accuracy updates
- [ ] Implement AI agents (miner, validator)
- [ ] Add error handling and validation
- [ ] Add loading states and UI polish
- [ ] Testing and bug fixes

## Documentation

All project documentation is located in `/docs`:

1. `01-project-overview.md` - Project summary and features
2. `02-system-design.md` - System architecture
3. `03-dev-contract.md` - Development rules
4. `04-folder-structure.md` - File organization
5. `05-roadmap.md` - Development phases
6. `06-database-schema.md` - **Database schema (AUTHORITATIVE)**
7. `07-api-contracts.md` - **API specifications (AUTHORITATIVE)**
8. `08-data-flow.md` - Data flow diagrams
9. `09-validation-rules.md` - Validation requirements
10. `10-ui-guidelines.md` - UI/UX specifications
11. `11-smart-contract-architecture.md` - Contract design
12. `12-onchain-interaction.md` - Blockchain integration

## Key Features

- **Swipe Interface**: Tinder-style prediction swiping
- **Dual Credits System**: Free credits + crypto-backed credits
- **Pari-Mutuel Payouts**: Fair pool-based reward distribution
- **Hash Integrity**: On-chain prediction and outcome verification
- **Leaderboard**: Weekly rankings by XP
- **User Profiles**: Track accuracy, streaks, and XP

## API Endpoints

- `GET /api/profile?wallet_address=0x...` - Fetch user profile
- `GET /api/predictions/next?user_wallet_address=0x...` - Get next prediction
- `POST /api/predictions/stake` - Record user swipe
- `POST /api/wallet/deposit` - Process deposit
- `POST /api/wallet/withdraw` - Initiate withdrawal
- `POST /api/hash/prediction` - Store prediction hash
- `POST /api/hash/outcome` - Store outcome hash
- `GET /api/leaderboard` - Fetch top users

## License

MIT
