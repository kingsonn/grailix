# Faucet System Setup Guide

## Overview

The faucet system allows users to claim 1,000 test USDC tokens once every 24 hours on BNB Testnet.

## Features

✅ **24-Hour Cooldown** - Users can claim once per day
✅ **Live Countdown Timer** - Shows time remaining until next claim
✅ **Disabled State** - Button appears grayed out during cooldown
✅ **Add to Wallet** - One-click button to add USDC token to MetaMask
✅ **Contract Info Display** - Shows network and contract address
✅ **Claim Tracking** - Records all claims in Supabase

## Setup Instructions

### Step 1: Create Faucet Claims Table

Run the SQL script in your Supabase SQL Editor:

```bash
# Copy and paste contents of create-faucet-claims-table.sql
```

This creates:
- `faucet_claims` table to track all claims
- `can_claim_faucet()` function to check eligibility
- `get_next_claim_time()` function to get next available claim time
- Indexes for fast lookups

**Verify:**
```sql
SELECT * FROM faucet_claims LIMIT 5;
```

### Step 2: Files Created

The following files were created/updated:

```
lib/
├── faucetActions.ts              # Server actions for claim tracking

components/
├── ClaimFaucetButton.tsx         # Updated with cooldown & modal

types/
├── ethereum.d.ts                 # TypeScript types for Web3

bots/
├── create-faucet-claims-table.sql  # Database setup
└── FAUCET_SETUP.md                 # This file
```

### Step 3: Environment Variables

Make sure these are set in your `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=your_service_key
NEXT_PUBLIC_TOKEN_ADDRESS=your_mockusdc_address
```

## How It Works

### User Flow

1. **First Visit**: User sees "Claim 1000 USDC" button
2. **Click Button**: Modal opens showing:
   - Amount (1,000 USDC)
   - Network (BNB Testnet)
   - Contract address (with copy button)
   - "Add to Wallet" button
3. **Claim**: User clicks "Claim Now"
4. **Transaction**: Wallet prompts for confirmation
5. **Success**: Claim is recorded in database
6. **Cooldown**: Button shows countdown timer for 24 hours

### Cooldown State

When user is in cooldown:
- Button background: Gray gradient
- Button text: "Next claim in Xh Ym Zs"
- Icon: ⏰ (clock)
- Button is disabled
- Modal shows cooldown timer if opened

### After Cooldown

After 24 hours:
- Button returns to normal green state
- User can claim again
- Timer resets after next claim

## Database Schema

### faucet_claims Table

```sql
id              serial          Primary key
user_id         uuid            Foreign key to users table
wallet_address  text            User's wallet address (lowercase)
claimed_at      timestamptz     When the claim was made
amount          numeric         Amount claimed (1000)
tx_hash         text            Transaction hash (optional)
```

### Indexes

- `idx_faucet_claims_user_id` - Fast user lookups
- `idx_faucet_claims_wallet` - Fast wallet lookups
- `idx_faucet_claims_claimed_at` - Fast time-based queries

## API Functions

### checkClaimStatus(walletAddress)

Checks if a wallet can claim and returns:

```typescript
{
  canClaim: boolean;           // Can user claim now?
  nextClaimTime: string | null; // ISO timestamp of next claim
  lastClaimTime: string | null; // ISO timestamp of last claim
  timeRemaining: number | null; // Milliseconds until next claim
}
```

### recordClaim(walletAddress, userId, amount, txHash)

Records a claim in the database after successful transaction.

## UI Components

### Main Button States

1. **Can Claim** (Green)
   - Icon: 💰
   - Text: "Claim 1000 USDC"
   - Clickable

2. **Cooldown** (Gray)
   - Icon: ⏰
   - Text: "Next claim in 23h 59m 45s"
   - Disabled

3. **Processing** (Green, disabled)
   - Icon: ⏳
   - Text: "Confirming..." or "Processing..."
   - Disabled

4. **Success** (Green)
   - Icon: ✅
   - Text: "Claimed!"
   - Temporarily shown

### Modal Features

- **Amount Display**: Large, prominent 1,000 USDC
- **Network Badge**: BNB Testnet with animated indicator
- **Contract Address**: Full address with copy button
- **Add to Wallet**: One-click MetaMask integration
- **Cooldown Warning**: Shows if user tries to claim during cooldown
- **Info Note**: Explains 24-hour limit and test tokens

## Testing

### Test Claim Flow

1. Connect wallet
2. Click "Claim 1000 USDC"
3. Verify modal shows correct info
4. Click "Claim Now"
5. Approve transaction in wallet
6. Wait for confirmation
7. Check that:
   - Success message appears
   - Button shows cooldown timer
   - Database has claim record

### Test Cooldown

```sql
-- Check last claim
SELECT * FROM faucet_claims 
WHERE wallet_address = 'your_wallet_address' 
ORDER BY claimed_at DESC 
LIMIT 1;

-- Check if can claim
SELECT can_claim_faucet('your_wallet_address');

-- Get next claim time
SELECT get_next_claim_time('your_wallet_address');
```

### Test Add to Wallet

1. Click "Add USDC to Wallet" button
2. MetaMask should prompt to add token
3. Approve in MetaMask
4. Token should appear in wallet

## Troubleshooting

### Button always shows cooldown

- Check if claim was recorded: `SELECT * FROM faucet_claims WHERE wallet_address = 'your_address'`
- Verify 24 hours have passed since last claim
- Clear browser cache and reload

### "Add to Wallet" not working

- Ensure MetaMask is installed
- Check that you're on BNB Testnet
- Verify TOKEN_ADDRESS is correct in .env

### Claims not being recorded

- Check Supabase service key is correct
- Verify user is logged in (user.id exists)
- Check browser console for errors
- Verify faucet_claims table exists

### Timer not updating

- Check browser console for errors
- Verify claimStatus is being fetched
- Ensure useEffect dependencies are correct

## Customization

### Change Cooldown Period

Edit `create-faucet-claims-table.sql`:

```sql
-- Change from 24 hours to 12 hours
return (now() - last_claim_time) >= interval '12 hours';
```

And in `faucetActions.ts`:

```typescript
// Change calculation
const nextClaimTime = new Date(lastClaimTime.getTime() + 12 * 60 * 60 * 1000);
```

### Change Claim Amount

Edit `ClaimFaucetButton.tsx`:

```typescript
// Change from 1000 to 500
const amount = parseUnits("500", 18);
```

Update all text references to "500 USDC".

### Change Token Symbol/Image

Edit `addTokenToWallet` function:

```typescript
symbol: "USDC",  // Change token symbol
decimals: 18,     // Change decimals if needed
image: "url",     // Change token icon URL
```

## Security Notes

- ✅ Wallet addresses are stored in lowercase for consistency
- ✅ Claims are tied to both wallet and user_id
- ✅ Server-side validation prevents manipulation
- ✅ Transaction hash is recorded for audit trail
- ⚠️ These are test tokens with no real value

## Future Enhancements

Potential improvements:
- Email notifications when cooldown expires
- Claim history page for users
- Admin dashboard to view all claims
- Variable claim amounts based on user level
- Referral bonuses for inviting friends
- Anti-bot measures (CAPTCHA, rate limiting)

## Support

For issues:
1. Check this documentation
2. Review browser console errors
3. Check Supabase logs
4. Verify all environment variables
5. Test with a fresh wallet address
