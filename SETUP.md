# Grailix - Quick Setup Guide

## ✅ What's Been Done

The complete project structure has been initialized with:

- ✅ Next.js 14 with App Router
- ✅ TypeScript configuration
- ✅ TailwindCSS setup
- ✅ Wagmi + Viem + RainbowKit for Web3
- ✅ Supabase client configuration
- ✅ All folder structure created
- ✅ Placeholder components
- ✅ Placeholder pages
- ✅ Placeholder API routes
- ✅ Agent file scaffolding
- ✅ TypeScript types for database

## 🚀 Next Steps

### 1. Install Dependencies

```bash
npm install
```

This will install all packages defined in `package.json`:
- Next.js, React, TypeScript
- Wagmi, Viem, RainbowKit
- Supabase client
- TailwindCSS
- Axios, dotenv

### 2. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 3. Verify Database Schema

Ensure your Supabase database has all tables from `/docs/06-database-schema.md`:
- users
- predictions
- user_prediction_stakes
- prediction_pools
- transactions
- leaderboard_weekly
- ai_raw_inputs
- ai_normalized_predictions

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

### 5. Test the Setup

1. Visit http://localhost:3000
2. You should see the home page with navigation buttons
3. Click "Connect Wallet" to test RainbowKit integration
4. Navigate to different pages (they will show placeholder content)

## 📁 Project Structure Overview

```
/grailix
├── /app                    # Next.js pages (App Router)
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   ├── /swipe             # Prediction swiping
│   ├── /wallet            # Deposit/withdraw
│   ├── /leaderboard       # Rankings
│   └── /profile           # User stats
├── /components            # React components
├── /lib                   # Utilities & config
├── /pages/api             # API routes
├── /agents                # Background workers
├── /types                 # TypeScript types
└── /docs                  # Documentation (READ THESE!)
```

## 🎯 Current Status

**Phase 1 (Initialization): COMPLETE ✅**

All files are scaffolded with:
- Basic imports
- Type definitions
- Placeholder UI
- TODO comments for implementation

**Phase 2 (Implementation): READY TO START**

Next tasks in order:
1. Implement wallet authentication flow
2. Implement prediction fetching API
3. Implement stake/swipe logic
4. Implement deposit/withdraw with smart contracts
5. Implement resolution engine
6. Implement AI agents

## ⚠️ Important Notes

### TypeScript Errors Expected

You will see TypeScript errors until you run `npm install`. These are normal:
- "Cannot find module 'next'"
- "Cannot find module 'react'"
- "Cannot find module 'wagmi'"
- etc.

All will resolve after installing dependencies.

### Documentation is Authoritative

**ALWAYS refer to `/docs` before implementing features:**
- `/docs/06-database-schema.md` - Database structure (DO NOT MODIFY)
- `/docs/07-api-contracts.md` - API specifications (DO NOT MODIFY)
- `/docs/08-data-flow.md` - Data flow patterns
- `/docs/09-validation-rules.md` - Validation requirements
- `/docs/10-ui-guidelines.md` - UI/UX specifications

### Smart Contracts

Contracts are already deployed on BNB Testnet:
- **MockUSDC**: `0x191C4781125f6aAB5203618637c69b22c914fa38`
- **GrailixVault**: `0x88B20685C92aebd53AB5351c95d25b8f300118C2`

ABIs are already included in `lib/contract.ts`.

## 🛠️ Development Workflow

1. **Read documentation** for the feature you're implementing
2. **Follow the exact schema** from docs
3. **Implement incrementally** - one feature at a time
4. **Test thoroughly** before moving to next feature
5. **Keep code modular** - follow existing patterns

## 📚 Key Files to Understand

- `lib/contract.ts` - Web3 configuration
- `lib/supabaseClient.ts` - Database client
- `types/supabase.ts` - Database types
- `app/providers.tsx` - Wagmi/RainbowKit setup
- `components/PredictionCard.tsx` - Main UI component

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
npx kill-port 3000
npm run dev
```

### Module not found errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors persist
```bash
npm run build
```

## 📞 Need Help?

Refer to:
- `/docs` folder for specifications
- `README.md` for project overview
- Next.js docs: https://nextjs.org/docs
- Wagmi docs: https://wagmi.sh
- Supabase docs: https://supabase.com/docs

---

**Ready to build! 🚀**
