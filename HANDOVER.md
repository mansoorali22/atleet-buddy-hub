# Atleet Buddy AI — Admin Handover Guide

## 1. System Overview

Atleet Buddy AI is a WhatsApp chatbot that answers sports nutrition questions using a RAG (Retrieval-Augmented Generation) pipeline backed by a sports nutrition book. It consists of two components:

- **Backend** — Python FastAPI service hosted on Render, connected to a Neon PostgreSQL database and the OpenAI API.
- **Dashboard** — React TypeScript admin panel hosted on Vercel for managing users, monitoring usage, and reviewing bot behavior.

---

## 2. Accessing the Dashboard

**URL:** Your Vercel deployment URL (e.g. `https://atleet-buddy-hub.vercel.app`)

**Login:** Use your admin email and password at the login page. Sessions last 24 hours before requiring re-authentication.

---

## 3. Dashboard Pages

### Dashboard (Home)
Overview cards showing total users, active subscriptions, messages today, and estimated daily cost. Use this as your daily health check.

### Users
Browse all WhatsApp users. Click any user to see their detail sheet including subscription status, plan, credits remaining, profile data (weight, height, goals, sport), and recent chat history. From the detail sheet you can:
- **Change plan** — switch between Buddy Start, Buddy Pro, etc.
- **Adjust credits** — add or remove message credits
- **Block/unblock** — prevent a user from using the bot
- **Edit subscription dates** — extend or shorten subscription periods

### Usage & Cost
Token usage and cost tracking. Shows daily message counts, average tokens per message, and cumulative cost. Use this to monitor spending and spot unusual spikes.

### Refusals
Lists messages the bot refused to answer (off-topic, medical advice, etc.). Each entry shows the user's question, the refusal category, and timestamp. High refusal rates may indicate the bot is being too strict or users are confused about what it can help with.

### Audit Log (Admin only)
Every admin action is logged here: plan changes, blocks, sent messages, logins. Use this for accountability and debugging ("who changed this user's plan?").

### Alerts
Automated alerts generated every 30 minutes:
- **Cost spike** — daily cost exceeds $5.00
- **Usage spike** — daily messages exceed 500
- **High refusal rate** — more than 25% of messages refused
- **Expiring subscriptions** — subscriptions ending within 3 days

Each alert can be acknowledged (you've seen it) or resolved (you've handled it). Resolved alerts can be reopened if the issue returns.

### FAQ Cache (Admin only)
Shows cached question-answer pairs. When the bot answers a common question, the answer is cached to reduce cost and speed up future responses. You can edit cached answers if they need correction, or delete entries to force a fresh answer.

### Support Accounts (Admin only)
Create accounts for support staff with limited access. Support accounts can view users, usage, and alerts but cannot access audit logs, FAQ cache, or support account management.

### Change Password
Change your own password. You'll be logged out and need to sign in again.

---

## 4. Common Tasks

### A user says the bot isn't responding
1. Go to **Users** and find them by WhatsApp number
2. Check their **subscription status** — if expired, they'll get an expiry message instead of answers
3. Check their **credits** — if zero, they need to purchase more
4. Check if they're **blocked**
5. Check **Audit Log** for any recent changes to their account

### A user gets wrong answers
1. Find the user in **Users** and review their **recent chats**
2. Check if their **profile data** is correct (wrong weight/goals could skew answers)
3. If the answer is being served from cache, go to **FAQ Cache** and edit or delete the cached entry

### Cost is too high
1. Check **Usage & Cost** for daily trends
2. Check **FAQ Cache** stats — a high cache hit rate saves money
3. Look for users sending unusually many messages in **Users**

### Creating a support account
1. Go to **Support Accounts**
2. Enter email, display name, and password
3. Share credentials with the support staff member
4. They'll have access to Users, Usage, Refusals, and Alerts — but not Audit Log, FAQ Cache, or account management

---

## 5. Backend Health Checks

### Health endpoint
```
GET https://your-render-url.onrender.com/health
```
Returns `{"status": "healthy", "database": "ok"}` when everything is working. Returns HTTP 503 with `"database": "unavailable"` if the DB is down.

### SQL health queries (run in Neon console)

**Daily message volume and cost:**
```sql
SELECT DATE(created_at) as day, COUNT(*) as messages,
       AVG(cost_usd) as avg_cost
FROM chat_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at) ORDER BY day;
```

**FAQ cache efficiency:**
```sql
SELECT COUNT(*) as cached_questions,
       SUM(hit_count) as total_cache_hits,
       AVG(hit_count) as avg_hits_per_question
FROM faq_cache;
```

**Refusal rate:**
```sql
SELECT response_type, COUNT(*) as count,
       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 1) as pct
FROM chat_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY response_type;
```

---

## 6. Architecture Quick Reference

| Component | Service | URL |
|-----------|---------|-----|
| Backend API | Render | Your Render dashboard |
| Database | Neon PostgreSQL | console.neon.tech |
| Dashboard | Vercel | Your Vercel dashboard |
| LLM | OpenAI API | platform.openai.com |
| Messaging | WhatsApp Business API | business.facebook.com |
| Payments | Plug & Pay | plugandpay.nl |

### Key environment variables (set in Render)
- `DATABASE_URL` — Neon connection string
- `OPENAI_API_KEY` — OpenAI API key
- `WHATSAPP_ACCESS_TOKEN` — Meta WhatsApp API token
- `ADMIN_JWT_SECRET` — Secret for dashboard authentication (must be a long random string)
- `DASHBOARD_ORIGINS` — Comma-separated allowed dashboard URLs for CORS

---

## 7. Alerts Reference

| Alert Type | Trigger | Suggested Action |
|------------|---------|-----------------|
| cost_spike | Daily cost > $5 | Check for unusual usage patterns, review message volume |
| usage_spike | Daily messages > 500 | Check if a single user is sending many messages |
| high_refusal_rate | > 25% refusals | Review refused messages — bot may be too strict |
| expired_subs | Subscription expires in < 3 days | Contact users about renewal |
