# Vercel Agents Setup - Complete ✅

## Overview
Successfully converted Grailix agents to Vercel-compatible API endpoints with CRON scheduling.

## Changes Made

### 1. Created API Endpoints
- **`/pages/api/run-agent1.ts`** - Wraps Agent-1 (Ingestor)
- **`/pages/api/run-agent3.ts`** - Wraps Agent-3 (Resolver)

Both endpoints:
- Use `@vercel/node` types for VercelRequest/VercelResponse
- Handle errors gracefully with 500 status codes
- Return JSON responses
- Include local test URLs in comments

### 2. Modified Agent Files for Serverless

#### `agents/agent-ingestor.ts`
- ✅ Removed `require.main === module` CLI entry point
- ✅ Removed `process.exit(1)` calls
- ✅ Updated env vars to use `SUPABASE_SERVICE_ROLE_KEY` instead of `ANON_KEY`
- ✅ Kept all core functionality intact

#### `agents/agent-resolver.ts`
- ✅ Removed `require.main === module` CLI entry point
- ✅ Replaced `process.exit(1)` with `throw new Error()`
- ✅ Updated env vars to use `SUPABASE_SERVICE_ROLE_KEY`
- ✅ Kept all resolution logic intact

#### `agents/agent-standardizer.ts`
- ✅ Removed CLI entry point
- ✅ Removed `process.exit(1)` calls
- ✅ Remains callable by Agent-1 internally

### 3. Created Vercel CRON Configuration
**`vercel.json`**
```json
{
  "crons": [
    {
      "path": "/api/run-agent1",
      "schedule": "*/1 * * * *"
    },
    {
      "path": "/api/run-agent3",
      "schedule": "*/1 * * * *"
    }
  ]
}
```

Both agents run every 1 minute.

### 4. Updated Dependencies
Added `@vercel/node` to `package.json` for TypeScript types.

## Environment Variables Required

Ensure these are set in Vercel dashboard:

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (not ANON_KEY!)

### Google Sheets (Agent-1)
- `GOOGLE_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON`

### Groq AI (Agent-2)
- `GROQ_API_KEY`

### Optional
- `PLATFORM_FEE` (defaults to 0.02)

## Local Testing

1. Install dependencies:
```bash
npm install
```

2. Start dev server:
```bash
npm run dev
```

3. Test endpoints:
- Agent-1: http://localhost:3000/api/run-agent1
- Agent-3: http://localhost:3000/api/run-agent3

## Deployment to Vercel

1. Push changes to Git
2. Vercel will auto-deploy
3. CRON jobs will activate automatically
4. Monitor logs in Vercel dashboard

## Agent Flow

```
Agent-1 (Ingestor)
  ↓
  Reads Google Sheets
  ↓
  Inserts to ai_raw_inputs
  ↓
  Calls Agent-2 (Standardizer) internally
  ↓
  Agent-2 processes with LLM
  ↓
  Creates predictions

Agent-3 (Resolver)
  ↓
  Finds expired predictions
  ↓
  Fetches prices (Yahoo/Binance/Coinbase)
  ↓
  Computes outcomes
  ↓
  Applies pari-mutuel payouts
  ↓
  Updates predictions as resolved
```

## Serverless Safety Checklist

✅ No `process.exit()` calls
✅ No `require.main === module` checks
✅ No filesystem writes (only reads for config)
✅ No child processes
✅ No infinite loops
✅ All timestamps use UTC
✅ Native `fetch()` for HTTP requests
✅ Proper error handling with try-catch
✅ No blocking operations

## Notes

- Agent-2 is NOT exposed as an endpoint (called internally by Agent-1)
- All logs use `console.log` (visible in Vercel logs)
- CRON schedule can be adjusted in `vercel.json`
- Agents are idempotent and safe to run concurrently
- Frontend UI remains unchanged
- Authentication logic preserved
