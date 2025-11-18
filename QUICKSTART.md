# 🚀 Grailix Agent Scheduler - Quick Start

## ⚡ 5-Minute Setup

### 1. Generate CRON_SECRET
```bash
openssl rand -base64 32
# Copy the output - you'll need it twice
```

### 2. Configure Environment Variables

**In Vercel Dashboard:**
1. Go to your project → Settings → Environment Variables
2. Add these variables:

```env
CRON_SECRET=<paste_your_generated_secret>
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=eyJxxx...
GROQ_API_KEY=gsk_xxx...
GOOGLE_SHEET_ID=1abc123...
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### 3. Configure GitHub Secret

**In GitHub Repository:**
1. Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `CRON_SECRET`
4. Value: `<same_secret_as_vercel>`

### 4. Update Deployment URL

Edit `.github/workflows/run-agents.yml`:
```yaml
# Line 18 and 33 - replace with your URL
curl -X POST "https://YOUR-APP.vercel.app/api/run-agent1"
curl -X POST "https://YOUR-APP.vercel.app/api/run-agent3"
```

### 5. Deploy & Test

```bash
# Push to GitHub
git add .
git commit -m "Add agent scheduler"
git push

# Wait for Vercel deployment
# Then go to GitHub → Actions → Run workflow (manual trigger)
```

## 🎯 What Happens

```
Every 1 minute:
  ├─ GitHub Actions triggers
  ├─ Calls /api/run-agent1 (with CRON_SECRET)
  │   └─ Agent-1 ingests from Google Sheets
  │       └─ Agent-2 creates predictions (auto-triggered)
  └─ Calls /api/run-agent3 (with CRON_SECRET)
      └─ Agent-3 resolves expired predictions
```

## ✅ Verify It's Working

### Check GitHub Actions
1. Go to Actions tab
2. See "Run Grailix Agents" workflow
3. Green checkmark = success ✅

### Check Vercel Logs
1. Vercel Dashboard → Deployments
2. Click latest deployment → Functions
3. See agent execution logs

### Expected Logs
```
🔐 Agent-1 API: Authorization validated
🔵 Agent-1 started at 2024-01-01T12:00:00.000Z
✅ Agent-1 complete. Inserted 2 rows
🔵 Agent-1 finished at 2024-01-01T12:00:10.000Z
```

## 🔧 Test Locally

```bash
# Start dev server
npm run dev

# In another terminal
curl -X POST "http://localhost:3000/api/run-agent1" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 📚 Full Documentation

- **Complete Guide**: `docs/AGENT_SCHEDULER_SETUP.md`
- **Implementation Details**: `AGENT_SCHEDULER_COMPLETE.md`
- **Environment Template**: `.env.example`

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | CRON_SECRET mismatch - check Vercel & GitHub |
| 500 Error | Check Vercel logs for missing env vars |
| Workflow not running | Enable GitHub Actions in repo settings |
| Timeout | Upgrade Vercel plan or reduce batch size |

## 🎉 You're Done!

Agents will now run automatically every minute. Monitor the first few runs to ensure everything works correctly.

---

**Need help?** Check `docs/AGENT_SCHEDULER_SETUP.md` for detailed troubleshooting.
