# 💰 MockUSDC Faucet Button - Implementation

## Overview

Replaced the Profile button on the dashboard with a **Claim 100 MockUSDC** button that calls the faucet function on the MockUSDC contract.

## Features

✅ **One-Click Claim**: Users can claim 100 MockUSDC with a single click  
✅ **Smart Amount**: Automatically sends 100 * 10^18 (100 tokens with 18 decimals)  
✅ **Transaction Feedback**: Shows loading states and success/error messages  
✅ **Wallet Integration**: Uses wagmi hooks for seamless Web3 interaction  
✅ **Visual Feedback**: Animated button with emoji states  

---

## Implementation Details

### Contract Function

The MockUSDC contract has a public faucet function:

```solidity
/// @notice Faucet-style mint for convenience
function faucet(uint256 amount) external {
    _mint(msg.sender, amount);
}
```

**Location**: `contracts/MockUSDC.sol`

### Component

**File**: `components/ClaimFaucetButton.tsx`

**Key Features**:
- Uses `useWriteContract` from wagmi to call the faucet function
- Uses `useWaitForTransactionReceipt` to track transaction status
- Parses 100 USDC as `parseUnits("100", 18)` = 100 * 10^18
- Shows different states: idle, pending, confirming, success
- Displays success alert when tokens are claimed

### Button States

| State | Emoji | Text | Disabled |
|-------|-------|------|----------|
| **Idle** | 💰 | Claim 100 USDC | No |
| **Pending** | ⏳ | Confirming... | Yes |
| **Confirming** | ⏳ | Processing... | Yes |
| **Success** | ✅ | Claimed! | Yes |

---

## Usage

### For Users

1. Connect wallet on dashboard
2. Click the **"Claim 100 USDC"** button
3. Approve transaction in wallet
4. Wait for confirmation
5. Success! 100 MockUSDC added to balance

### For Developers

The button is automatically displayed in the dashboard when user is connected:

```tsx
<ClaimFaucetButton />
```

---

## Configuration

### Environment Variables

Make sure `.env.local` has the MockUSDC contract address:

```env
NEXT_PUBLIC_TOKEN_ADDRESS=0x...
```

### Contract ABI

The faucet function is already included in `lib/contract.ts`:

```typescript
export const MockUSDC_ABI = [
  // ... other functions
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
```

---

## Transaction Flow

```
User clicks "Claim 100 USDC"
    ↓
parseUnits("100", 18) → 100000000000000000000
    ↓
writeContract({
  address: TOKEN_ADDRESS,
  abi: MockUSDC_ABI,
  functionName: "faucet",
  args: [100000000000000000000]
})
    ↓
User approves in wallet
    ↓
Transaction submitted to blockchain
    ↓
Wait for confirmation
    ↓
✅ Success! User receives 100 MockUSDC
```

---

## Error Handling

### Common Errors

**"Please connect your wallet first"**
- User must connect wallet before claiming
- Solution: Click "Connect Wallet" button first

**"MockUSDC contract address not configured"**
- `NEXT_PUBLIC_TOKEN_ADDRESS` not set in environment
- Solution: Add contract address to `.env.local`

**Transaction Rejected**
- User rejected transaction in wallet
- Solution: Try again and approve in wallet

**Insufficient Gas**
- Not enough ETH for gas fees
- Solution: Add ETH to wallet for gas

---

## Testing

### Local Testing

1. Deploy MockUSDC contract to local network
2. Add contract address to `.env.local`
3. Connect wallet
4. Click "Claim 100 USDC"
5. Verify balance increased by 100

### Check Balance

```typescript
// In browser console
import { readContract } from 'wagmi/actions';

const balance = await readContract({
  address: TOKEN_ADDRESS,
  abi: MockUSDC_ABI,
  functionName: 'balanceOf',
  args: [userAddress]
});

console.log('Balance:', balance / 10n**18n, 'USDC');
```

---

## Styling

The button matches the dashboard's terminal theme:

- **Default**: Dark background with green profit accent
- **Hover**: Brighter green glow effect
- **Disabled**: Reduced opacity, no interaction
- **Animation**: Icon scales on hover

```tsx
className="group bg-gradient-to-br from-void-graphite to-profit/5 
  hover:from-profit/10 hover:to-profit/20 
  border border-profit/20 hover:border-profit/50 
  rounded-lg p-4 transition-all 
  hover:shadow-lg hover:shadow-profit/20 
  disabled:opacity-50 disabled:cursor-not-allowed"
```

---

## Integration Points

### Dashboard (HomeClient.tsx)

**Before**:
```tsx
<Link href="/profile">
  <div>👤 Profile</div>
</Link>
```

**After**:
```tsx
<ClaimFaucetButton />
```

### Location

The button appears in the quick actions section, replacing the profile button:

```
Dashboard
  ├─ Portfolio Overview (Balance, Win Rate, XP, Streak)
  ├─ Quick Actions
  │   ├─ ⚡ Predict
  │   ├─ 📊 History  
  │   ├─ 🏆 Ranks
  │   └─ 💰 Claim 100 USDC ← NEW
  └─ Status Bar
```

---

## Future Enhancements

Potential improvements:

1. **Cooldown Timer**: Limit claims to once per day/hour
2. **Balance Display**: Show current MockUSDC balance
3. **Custom Amount**: Allow users to specify claim amount
4. **Transaction History**: Show recent faucet claims
5. **Gas Estimation**: Display estimated gas cost before claiming

---

## Files Modified

1. ✅ **Created**: `components/ClaimFaucetButton.tsx` - Faucet button component
2. ✅ **Modified**: `components/HomeClient.tsx` - Replaced profile button
3. ✅ **Existing**: `lib/contract.ts` - Already has faucet ABI
4. ✅ **Existing**: `contracts/MockUSDC.sol` - Already has faucet function

---

## Summary

✅ **Replaced**: Profile button → Claim 100 USDC button  
✅ **Amount**: 100 * 10^18 (100 tokens with 18 decimals)  
✅ **Function**: Calls `faucet(amount)` on MockUSDC contract  
✅ **Feedback**: Loading states, success alerts, error handling  
✅ **Styling**: Matches dashboard terminal theme  

**Status**: ✅ **READY TO USE**

Users can now easily claim test tokens directly from the dashboard! 💰
