# Grailix Agent Scheduler Setup Guide

## Overview

This guide explains how to set up the production-grade scheduled agent system for Grailix. The system runs three agents on a schedule:

- **Agent-1 (Ingestor)**: Reads Google Sheets → writes to `ai_raw_inputs` → triggers Agent-2
- **Agent-2 (Standardizer)**: Converts raw inputs to predictions (market-aware, triggered by Agent-1)
- **Agent-3 (Resolver)**: Resolves predictions, applies payouts, updates balances

## Architecture

```
GitHub Actions (every 1 minute)
    ↓
    ├─→ POST /api/run-agent1 (with CRON_SECRET)
    │       ↓
    │   Agent-1 → Agent-2 (automatic handoff)
    │
    └─→ POST /api/run-agent3 (with CRON_SECRET)
            ↓
        Agent-3 (resolver)
```

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

**Required variables:**

```env
# Generate a secure CRON_SECRET
CRON_SECRET=your_secure_random_string_here

# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=your_service_role_key

# Groq API for LLM sentiment analysis
GROQ_API_KEY=your_groq_api_key

# Google Sheets integration
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

**Generate a secure CRON_SECRET:**

```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 2. Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add all environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add each variable from `.env.local`
   - **IMPORTANT**: Add `CRON_SECRET` as a secret

### 3. Configure GitHub Secrets

Add the `CRON_SECRET` to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `CRON_SECRET`
5. Value: Same value as in Vercel environment variables
6. Click "Add secret"

### 4. Update Deployment URL

Edit `.github/workflows/run-agents.yml` and replace `grailix.vercel.app` with your actual Vercel deployment URL:

```yaml
curl -X POST "https://YOUR-DEPLOYMENT-URL.vercel.app/api/run-agent1"
```

### 5. Enable GitHub Actions

1. Go to your GitHub repository
2. Navigate to Actions tab
3. Enable workflows if prompted
4. The workflow will run automatically every minute

## API Endpoints

### POST /api/run-agent1

Runs Agent-1 (Ingestor) which reads Google Sheets and triggers Agent-2.

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response (Success):**
```json
{
  "success": true,
  "agent": "agent-1",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Response (Error):**
```json
{
  "success": false,
  "agent": "agent-1",
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### POST /api/run-agent3

Runs Agent-3 (Resolver) which resolves expired predictions.

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response format:** Same as Agent-1

## Security

### CRON_SECRET Validation

All API routes validate the `Authorization` header:

```typescript
const auth = req.headers.authorization;
const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

if (!auth || auth !== expectedAuth) {
  return res.status(401).json({ error: "Unauthorized" });
}
```

**Security best practices:**

1. ✅ Never commit `.env.local` to git
2. ✅ Use a strong, random CRON_SECRET (32+ characters)
3. ✅ Keep CRON_SECRET in sync between Vercel and GitHub
4. ✅ Rotate CRON_SECRET periodically
5. ✅ Monitor API logs for unauthorized access attempts

## Testing

### Manual Testing

Test the API routes locally:

```bash
# Start the dev server
npm run dev

# Test Agent-1 (in another terminal)
curl -X POST "http://localhost:3000/api/run-agent1" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test Agent-3
curl -X POST "http://localhost:3000/api/run-agent3" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Manual GitHub Actions Trigger

1. Go to Actions tab in GitHub
2. Select "Run Grailix Agents" workflow
3. Click "Run workflow"
4. Select branch and click "Run workflow"

## Monitoring

### View Logs

**Vercel Logs:**
1. Go to Vercel dashboard
2. Select your project
3. Navigate to Deployments → [Latest] → Functions
4. View real-time logs

**GitHub Actions Logs:**
1. Go to Actions tab in GitHub
2. Click on a workflow run
3. Expand job steps to view logs

### Expected Log Output

**Agent-1:**
```
🔐 Agent-1 API: Authorization validated
🔵 Agent-1 started at 2024-01-01T00:00:00.000Z
🔵 Agent-1: Starting ingestion (Sheets → ai_raw_inputs)...
✅ Agent-1 complete. Inserted 5 rows into ai_raw_inputs.
🔵 Agent-2 started at 2024-01-01T00:00:05.000Z
✅ Agent-2 done.
🔵 Agent-1 finished at 2024-01-01T00:00:10.000Z
```

**Agent-3:**
```
🔐 Agent-3 API: Authorization validated
🔵 Agent-3 started at 2024-01-01T00:00:00.000Z
🚀 Agent-3: Starting resolver...
📋 Found 3 predictions to resolve
✅ Prediction 123 resolved: outcome=YES, price=50000
✅ Agent-3 resolver complete
🔵 Agent-3 finished at 2024-01-01T00:00:15.000Z
```

## Troubleshooting

### Issue: 401 Unauthorized

**Cause:** CRON_SECRET mismatch

**Solution:**
1. Verify CRON_SECRET in Vercel matches GitHub secret
2. Check for extra spaces or newlines
3. Redeploy after updating environment variables

### Issue: 500 Internal Server Error

**Cause:** Missing environment variables or agent logic error

**Solution:**
1. Check Vercel logs for detailed error
2. Verify all required env vars are set
3. Test agents locally first

### Issue: Workflow not running

**Cause:** GitHub Actions disabled or workflow file error

**Solution:**
1. Enable GitHub Actions in repository settings
2. Check workflow file syntax
3. Verify CRON_SECRET is added to GitHub secrets

### Issue: Vercel timeout

**Cause:** Agent execution takes too long (>10s on Hobby plan)

**Solution:**
1. Upgrade to Vercel Pro for 60s timeout
2. Optimize agent logic to process fewer rows per run
3. Consider splitting into smaller batches

## Customization

### Change Schedule Frequency

Edit `.github/workflows/run-agents.yml`:

```yaml
on:
  schedule:
    # Every 5 minutes
    - cron: "*/5 * * * *"
    
    # Every hour
    - cron: "0 * * * *"
    
    # Every day at midnight UTC
    - cron: "0 0 * * *"
```

**CRON syntax:**
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
* * * * *
```

### Add Notifications

Add Slack/Discord notifications to GitHub Actions:

```yaml
- name: Notify on failure
  if: failure()
  run: |
    curl -X POST YOUR_WEBHOOK_URL \
      -H 'Content-Type: application/json' \
      -d '{"text":"Agent execution failed!"}'
```

## Production Checklist

- [ ] All environment variables set in Vercel
- [ ] CRON_SECRET added to GitHub secrets
- [ ] Deployment URL updated in workflow file
- [ ] GitHub Actions enabled
- [ ] Test manual workflow trigger
- [ ] Monitor first scheduled run
- [ ] Set up error notifications
- [ ] Document CRON_SECRET in password manager
- [ ] Review Vercel function logs
- [ ] Verify Supabase RLS policies allow service key

## Agent Logic Preservation

**All existing agent logic is preserved:**

✅ Sentiment detection (LLM-based)  
✅ Expiry calculation (market-aware)  
✅ Reference type resolution  
✅ Payout system (pari-mutuel)  
✅ RPC balance updates  
✅ SHA-256 hashing  
✅ Prediction insertion  
✅ Holiday-aware logic  
✅ Price fetching (Yahoo, Binance, Coinbase)  
✅ Transaction logging  

**Only changes made:**
- Removed `require.main === module` blocks
- Added start/finish timestamps to logs
- Wrapped execution in API handlers with CRON_SECRET validation

## Support

For issues or questions:
1. Check Vercel function logs
2. Check GitHub Actions logs
3. Review this documentation
4. Test agents locally with `npm run dev`
