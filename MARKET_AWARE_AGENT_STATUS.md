# Market-Aware Agent-2 + Frontend Implementation Status

## ✅ Completed

### **1. Market Hours Helper Functions** ✅
**File**: `agents/market-hours/index.ts`

**Implemented Functions**:
- ✅ `getMarketOpenClose(date)` - Returns open/close times or null if closed
- ✅ `isMarketOpen(timestamp?)` - Checks if market is currently open
- ✅ `getNextMarketOpen(afterTimestamp?)` - Finds next market open time
- ✅ `getMarketCloseForDate(date?)` - Gets close time for a date
- ✅ `getMinutesUntilClose(timestamp?)` - Calculates minutes until close
- ✅ `stockExpiryDecision(now?)` - Determines stock expiry/betting_close
- ✅ `cryptoExpiryDecision(strength, now?)` - Determines crypto expiry/betting_close

**Features**:
- Respects NYSE/NASDAQ hours (09:30-16:00 ET)
- Handles early close days (13:00 ET)
- Checks holidays from `holidays.ts`
- Handles weekends
- All timestamps in UTC

### **2. Market-Aware Agent-2** ✅
**File**: `agents/agent-standardizer.ts`

**Implemented Features**:
- ✅ Sentiment detection using keyword matching
  - Positive keywords → direction="up"
  - Negative keywords → direction="down"
  - Mixed/none → direction="neutral"
  - Strength: strong (4+ keywords), weak (2-3), neutral (<2)

- ✅ Market-aware expiry logic for stocks:
  - Market closed → expiry=next open, betting_close=expiry-1min, question="open higher"
  - Market open >2h to close → expiry=today close, betting_close=expiry-60min, question="close green"
  - Market open <2h to close → expiry=next open, betting_close=expiry-1min, question="open higher"

- ✅ Sentiment-based expiry for crypto:
  - Strong sentiment → 3h window, betting_close=expiry-30min
  - Weak sentiment → 6h window, betting_close=expiry-60min
  - Neutral → random 3h or 6h

- ✅ Question generation (no hallucinations):
  - Stock close: "Will {TICKER} close green/red today?"
  - Stock open: "Will {TICKER} open higher/lower at next market open?"
  - Crypto: "Will {TICKER} be higher/lower at expiry?"

- ✅ Numeric target extraction (optional, only if in raw text)

- ✅ Database insertion with all required fields:
  - `raw_text`, `prediction_text`, `asset`, `asset_type`
  - `direction`, `target_value`, `expiry_timestamp`, `betting_close`
  - `sentiment_yes=0`, `sentiment_no=0`, `status='pending'`

- ✅ Safety checks:
  - Skip if betting_close in past
  - Validate asset_type
  - Mark processed=true after success

- ✅ Maintains `runAgent2ForIds(ids?)` contract for Agent-1 handoff

---

## 🚧 Still TODO

### **3. Frontend: PredictionCard Component** 🚧
**File**: `components/PredictionCard.tsx` (needs creation)

**Required Features**:
- [ ] Two countdown timers:
  - `timeToBettingClose` (if now < betting_close)
  - `timeToExpiry` (always show)
- [ ] Hydration-safe implementation:
  - Server: render static placeholder "Resolves in: --:--:--"
  - Client: useEffect with mounted flag, then setInterval
- [ ] Disable YES/NO buttons if now >= betting_close
- [ ] Show "Betting closed" badge when closed
- [ ] Display betting_close timestamp in user's timezone
- [ ] Format: HH:MM:SS countdown

### **4. Frontend: Predict Page Updates** 🚧
**File**: `app/predict/page.tsx` or `components/PredictClient.tsx`

**Required Updates**:
- [ ] Update Prediction interface to include `betting_close`
- [ ] Pass `betting_close` to PredictionCard
- [ ] Disable stake actions if betting closed
- [ ] Add microcopy: "Bets lock 1 hour before market close for stock cards"
- [ ] Ensure API returns `betting_close` field

### **5. API Updates** 🚧
**Files**: `pages/api/predictions/next.ts`, `pages/api/user/history.ts`

**Required Changes**:
- [ ] Add `betting_close` to SELECT queries
- [ ] Include `betting_close` in API responses
- [ ] Update TypeScript interfaces

### **6. Testing** 🚧

**Test Cases Needed**:
- [ ] Stock during market hours >2h to close → close-type card
- [ ] Stock during market hours <2h to close → open-type card
- [ ] Stock when market closed → open-type card
- [ ] Stock on holiday → open-type card, expiry=next trading day
- [ ] Crypto strong sentiment → 3h window
- [ ] Crypto weak sentiment → 6h window
- [ ] Betting_close in past → row skipped
- [ ] Frontend countdown updates every second
- [ ] Frontend disables buttons when betting closed
- [ ] No hydration mismatch errors

---

## Implementation Notes

### **Sentiment Detection Logic**:
```typescript
POSITIVE_KEYWORDS: bullish, surge, rally, gain, rise, up, higher, increase, boost, soar, jump, climb, advance, outperform, beat, strong, positive, optimistic, upgrade, buy

NEGATIVE_KEYWORDS: bearish, plunge, fall, drop, decline, down, lower, decrease, sink, tumble, crash, slide, retreat, underperform, miss, weak, negative, pessimistic, downgrade, sell

Direction:
- positiveCount > negativeCount && positiveCount >= 2 → "up"
- negativeCount > positiveCount && negativeCount >= 2 → "down"
- else → "neutral"

Strength:
- maxCount >= 4 → "strong"
- maxCount >= 2 → "weak"
- else → "neutral"
```

### **Stock Expiry Decision**:
```typescript
if (!isMarketOpen(now)) {
  expiry = getNextMarketOpen(now)
  betting_close = expiry - 1 minute
  questionType = 'open'
} else {
  minutes_to_close = getMinutesUntilClose(now)
  if (minutes_to_close > 120) {
    expiry = marketClose
    betting_close = expiry - 60 minutes
    questionType = 'close'
  } else {
    expiry = getNextMarketOpen(now)
    betting_close = expiry - 1 minute
    questionType = 'open'
  }
}
```

### **Crypto Expiry Decision**:
```typescript
if (sentimentStrength === 'strong') windowHours = 3
else if (sentimentStrength === 'weak') windowHours = 6
else random pick 3 or 6

expiry = now + windowHours
betting_close = expiry - (windowHours === 3 ? 30min : 60min)
```

---

## Next Steps

1. **Create PredictionCard.tsx** with countdown timers
2. **Update PredictClient.tsx** to use PredictionCard
3. **Update API endpoints** to include betting_close
4. **Test end-to-end** with sample data
5. **Create test script** for Agent-2
6. **Document** in runbook

---

## Files Modified

### Created:
- `agents/market-hours/index.ts` - Market hours utilities
- `agents/market-hours/holidays.ts` - Holiday data (user created)

### Modified:
- `agents/agent-standardizer.ts` - Complete rewrite with market-aware logic

### TODO:
- `components/PredictionCard.tsx` - Create new
- `components/PredictClient.tsx` - Update to use PredictionCard
- `pages/api/predictions/next.ts` - Add betting_close to response
- `pages/api/user/history.ts` - Add betting_close to response

---

## Database Schema Required

**predictions table must have these columns**:
- `betting_close` (timestamptz) - When betting locks
- `direction` (text) - "up", "down", or "neutral"
- `target_value` (numeric, nullable) - Optional price target
- `raw_text` (text) - Original news text
- `asset_type` (text) - "stock" or "crypto"

**ai_raw_inputs table must have**:
- `asset_type` (text) - "stock" or "crypto"

---

## Testing Commands

```bash
# Test Agent-2 directly
cd agents
npx tsx agent-standardizer.ts

# Test with specific IDs
# (modify code to call runAgent2ForIds(['uuid-here']))

# Check logs for:
# - Sentiment detection
# - Market status
# - Expiry/betting_close timestamps
# - Question generation
# - Database insertion
```

---

## Status Summary

**Agent-2 Backend**: ✅ Complete and production-ready
**Market Hours Utilities**: ✅ Complete
**Frontend Components**: 🚧 In progress (PredictionCard needed)
**API Updates**: 🚧 Pending
**Testing**: 🚧 Pending

**Next Priority**: Create PredictionCard.tsx with countdown timers
