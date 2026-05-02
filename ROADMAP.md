# Atleet Buddy Hub — Development Roadmap & Implementation Plan

**Version:** 2.0
**Date:** April 29, 2026
**Scope:** Stages B through E — connecting the dashboard prototype to the live WhatsApp chatbot backend

---

## The Big Picture

There are **two repos** that form one product:

| Repo | Stack | Status | Role |
|------|-------|--------|------|
| `whatsapp-chatbot` | Python, FastAPI, Neon PostgreSQL, pgvector, OpenAI, LangChain, Meta WhatsApp Cloud API, PlugAndPay | **Live in production** on Render | The brain — handles messages, RAG, payments, subscriptions |
| `atleet-buddy-hub` | React 18, TypeScript, Vite, Tailwind, shadcn/ui | **Frontend prototype** with mock data | The eyes — admin dashboard to monitor and manage everything |

**The core job:** Wire the dashboard (Hub) to the chatbot's existing Neon PostgreSQL database so admins see real data and can take real actions.

---

## Existing Backend (What's Already Built)

### Database: Neon PostgreSQL (with pgvector)

**Connection:** `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`

### Existing Tables

#### `subscriptions`
```
id                    INTEGER PRIMARY KEY
whatsapp_number       VARCHAR(20) UNIQUE NOT NULL
status                VARCHAR(20) DEFAULT 'inactive'     -- active | expired | blocked
plan_name             VARCHAR(50)                        -- Trial, Subscription Start/Active/Pro, 50/100 credits
is_recurring          BOOLEAN DEFAULT FALSE
plugnpay_customer_id  VARCHAR(100)
credits               INTEGER DEFAULT 15
total_purchased       INTEGER DEFAULT 0
message_count         INTEGER DEFAULT 0
is_trial              BOOLEAN DEFAULT TRUE
subscription_start    TIMESTAMP WITH TZ
subscription_end      TIMESTAMP WITH TZ
created_at            TIMESTAMP WITH TZ
updated_at            TIMESTAMP WITH TZ
```

#### `chat_logs`
```
id                    INTEGER PRIMARY KEY
whatsapp_number       VARCHAR(20) NOT NULL
user_message          TEXT NOT NULL
bot_response          TEXT NOT NULL
response_type         VARCHAR(50)         -- answered | refused | error | greeting | thanks
chunks_used           JSON                -- [{page, chunk_index, section, source}, ...]
history_snapshot      JSON
created_at            TIMESTAMP WITH TZ
INDEX idx_user_history (whatsapp_number, created_at)
```

#### `processed_messages`
```
message_id            VARCHAR(255) PRIMARY KEY   -- WhatsApp wamid (dedup cache)
created_at            TIMESTAMP WITH TZ
```

#### `langchain_pg_embedding` (auto-managed by LangChain)
```
uuid                  UUID PRIMARY KEY
collection_id         UUID FK
embedding             vector(1536)
document              VARCHAR           -- chunk text
cmetadata             JSONB             -- {page, chunk_index, source, document_type, section}
created_at            TIMESTAMP WITH TZ
```

### Existing API Endpoints (FastAPI on Render)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/whatsapp/get-messages` | GET | Meta webhook verification |
| `/whatsapp/get-messages` | POST | Receive WhatsApp messages → RAG → reply |
| `/whatsapp/send` | POST | Manually send WhatsApp message to a number |
| `/plugpay/webhook` | POST | PlugAndPay payment events |

### What's Already Tracked

- Every Q&A exchange (chat_logs with response_type)
- Refusals (response_type = 'refused' in chat_logs)
- User subscriptions, credits, plan type
- Message count per user
- RAG chunks used per answer
- Chat history (last 10 per user)

### What's NOT Tracked Yet

- OpenAI token counts (prompt_tokens, completion_tokens) per message
- Cost in USD per message
- Admin actions / audit events
- Alert conditions
- Admin user accounts

---

## Architecture Decision: How the Dashboard Talks to the Database

### Option A: Direct Neon Connection from Dashboard (Simpler)

The React dashboard uses a thin API layer to query Neon directly. Two approaches:

**A1. Neon HTTP/Serverless Driver** — Use `@neondatabase/serverless` from Vercel Edge Functions or Cloudflare Workers. The dashboard deploys to Vercel, edge functions query Neon over HTTP (no persistent connection needed).

**A2. Dedicated API service** — A lightweight Express/Fastify server (or Python FastAPI) deployed alongside the chatbot on Render, exposing admin-only endpoints. This is the cleanest separation of concerns.

### Option B: Extend the Existing FastAPI (Recommended)

Add admin endpoints directly to the `whatsapp-chatbot` FastAPI app. The chatbot already has the database connection, models, and business logic. Adding `/admin/*` routes is the least-effort path and avoids duplicating DB connection setup.

**Recommendation: Option B.** Add an `/admin` router to the existing FastAPI app. Protect it with API key or JWT auth. The React dashboard calls these endpoints.

### New Admin Endpoints to Add to `whatsapp-chatbot`

```
/admin/auth/login              POST   — Admin login (returns JWT)
/admin/auth/me                 GET    — Current admin user

/admin/users                   GET    — Paginated user list (with search, filters)
/admin/users/:number           GET    — Single user detail + recent chat logs
/admin/users/:number/plan      PATCH  — Change plan/credits
/admin/users/:number/status    PATCH  — Change status (active/expired/blocked)
/admin/users/:number/dates     PATCH  — Edit subscription dates
/admin/users/:number/block     POST   — Block user
/admin/users/:number/unblock   POST   — Unblock user
/admin/users/:number/send      POST   — Send manual WhatsApp message

/admin/usage/summary           GET    — Total messages, users, costs (date range)
/admin/usage/daily             GET    — Per-day message/token/cost breakdown
/admin/usage/per-user          GET    — Per-user rollup

/admin/refusals/grouped        GET    — Refusal categories with counts
/admin/refusals/trend          GET    — Refusal rate over time

/admin/audit                   GET    — Paginated audit log

/admin/alerts                  GET    — Active alerts
/admin/alerts/:id/resolve      PATCH  — Resolve an alert
/admin/alerts/config           GET/PUT — Alert thresholds

/admin/health                  GET    — System health (DB, OpenAI, WhatsApp API status)
```

---

## Stage B — Dashboard Upgrades

**Goal:** Turn the mock dashboard into a live admin tool reading from the production Neon DB.

**Estimated effort:** 4–5 weeks

---

### B0. Foundation (Week 1)

Everything else depends on this. Set up the plumbing between dashboard and backend.

#### B0.1 New Tables in Neon

Add these tables to the existing database (the chatbot doesn't need them, but the admin system does):

```sql
-- Admin users (separate from WhatsApp users)
CREATE TABLE admin_users (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  display_name    VARCHAR(100),
  role            VARCHAR(20) NOT NULL DEFAULT 'support',  -- 'admin' | 'support'
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_login_at   TIMESTAMPTZ
);

-- Audit log (every admin action)
CREATE TABLE audit_events (
  id              SERIAL PRIMARY KEY,
  actor_id        INTEGER REFERENCES admin_users(id),
  actor_email     VARCHAR(255) NOT NULL,
  action          VARCHAR(50) NOT NULL,    -- PLAN_CHANGE, STATUS_CHANGE, BLOCK, UNBLOCK, SEND_MESSAGE, etc.
  target_type     VARCHAR(20),             -- 'user', 'alert', 'config'
  target_id       VARCHAR(100),            -- whatsapp_number or alert ID
  details         JSONB,                   -- {from: 'monthly', to: 'quarterly', reason: '...'}
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts
CREATE TABLE alerts (
  id              SERIAL PRIMARY KEY,
  type            VARCHAR(50) NOT NULL,    -- spend_spike, message_limit, high_refusal_rate, blocked_attempt, expiry_warning
  severity        VARCHAR(20) NOT NULL,    -- high, medium, low
  message         TEXT NOT NULL,
  metadata        JSONB,                   -- {user: '+31612345678', current_value: 52, threshold: 45}
  status          VARCHAR(20) DEFAULT 'active',  -- active | resolved
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ,
  resolved_by     INTEGER REFERENCES admin_users(id)
);

-- Alert thresholds (admin-configurable)
CREATE TABLE alert_config (
  id              SERIAL PRIMARY KEY,
  alert_type      VARCHAR(50) UNIQUE NOT NULL,
  enabled         BOOLEAN DEFAULT TRUE,
  threshold       JSONB NOT NULL,          -- {value: 45, unit: 'USD'} or {value: 10, unit: 'percent'}
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_by      INTEGER REFERENCES admin_users(id)
);
```

#### B0.2 Add Admin Router to FastAPI

In the `whatsapp-chatbot` repo, create:

```
app/
  api/
    admin/
      __init__.py
      auth.py        — login, JWT creation, middleware
      users.py       — user CRUD + actions
      usage.py       — aggregation queries on chat_logs
      refusals.py    — queries where response_type = 'refused'
      audit.py       — audit_events queries
      alerts.py      — alerts CRUD + config
      health.py      — system health checks
  middleware/
    admin_auth.py    — JWT verification dependency
```

Register in `main.py`:
```python
from app.api.admin import router as admin_router
app.include_router(admin_router, prefix="/admin")
```

#### B0.3 Dashboard API Layer

In the `atleet-buddy-hub` repo, create:

```
src/
  types/
    user.ts          — User, UserStatus, Plan (matching subscriptions table)
    usage.ts         — UsageSummary, DailyUsage, PerUserUsage
    refusal.ts       — RefusalGroup, RefusalTrend
    audit.ts         — AuditEvent, AuditAction
    alert.ts         — Alert, AlertConfig
    auth.ts          — LoginRequest, LoginResponse, AdminUser, Role
  services/
    api.ts           — Axios instance with base URL + JWT header injection
    auth.service.ts
    users.service.ts
    usage.service.ts
    refusals.service.ts
    audit.service.ts
    alerts.service.ts
  hooks/
    useAuth.ts       — Auth context + protected route logic
    useUsers.ts      — React Query hooks for user data
    useUsage.ts
    useRefusals.ts
    useAuditLog.ts
    useAlerts.ts
```

#### B0.4 Environment Setup

Add to `atleet-buddy-hub/.env.local`:
```
VITE_API_URL=https://whatsapp-chatbot-ypib.onrender.com/admin
```

#### B0.5 Enable TypeScript Strict Mode

In `tsconfig.app.json`, enable:
```json
"strictNullChecks": true,
"noImplicitAny": true
```

Fix resulting type errors across the codebase.

#### B0.6 Deliverables

- [ ] SQL migration: admin_users, audit_events, alerts, alert_config tables
- [ ] FastAPI: admin router skeleton with JWT auth middleware
- [ ] React: services/, types/, hooks/ directory structure
- [ ] React: API client with auth header injection
- [ ] React: environment variable for API URL
- [ ] TypeScript strict mode enabled + all type errors fixed

---

### B1. User Management Dashboard (Week 2)

**Current state:** `UsersPage.tsx` has a mock table with 6 fake users. Action menu does nothing.

**What changes:** The table reads from `GET /admin/users` which queries the `subscriptions` table directly.

#### B1.1 Backend: User Endpoints

```python
# GET /admin/users?search=&status=&plan=&page=1&per_page=20
# Queries: SELECT * FROM subscriptions WHERE ... ORDER BY created_at DESC
# Returns: { users: [...], total: 247, page: 1, pages: 13 }

# GET /admin/users/{whatsapp_number}
# Returns: subscription row + last 20 chat_logs for this user

# PATCH /admin/users/{whatsapp_number}/plan
# Body: { plan_name: "Subscription Pro", credits: 300, is_recurring: true }
# Action: Update subscription row + insert audit_event

# PATCH /admin/users/{whatsapp_number}/status
# Body: { status: "blocked" }
# Action: Update subscription row + insert audit_event

# PATCH /admin/users/{whatsapp_number}/dates
# Body: { subscription_start: "...", subscription_end: "..." }
# Action: Update subscription row + insert audit_event

# POST /admin/users/{whatsapp_number}/block
# Action: Set status='blocked' + insert audit_event

# POST /admin/users/{whatsapp_number}/unblock
# Action: Set status='active' + insert audit_event

# POST /admin/users/{whatsapp_number}/send
# Body: { message: "Your plan has been upgraded" }
# Action: Call send_whatsapp_message() + insert audit_event
```

Every mutation writes an audit event — this is how B5 (Audit Log) gets its data for free.

#### B1.2 Expiry Enforcement

Add a scheduled job to the FastAPI app (APScheduler, alongside the existing midnight cleanup):

```python
# Runs daily at 00:05 UTC
def enforce_subscription_expiry():
    expired = db.query(Subscription).filter(
        Subscription.status == 'active',
        Subscription.subscription_end < datetime.utcnow()
    ).all()
    
    for sub in expired:
        sub.status = 'expired'
        # Insert alert
        db.add(Alert(type='expiry', severity='low', ...))
        # Insert audit event
        db.add(AuditEvent(action='AUTO_EXPIRE', ...))
    
    db.commit()
```

This replaces the existing behavior where `verify_subscription()` silently rejects expired users — now the status is explicitly updated and visible in the dashboard.

#### B1.3 Frontend Changes to UsersPage.tsx

- Replace hardcoded `users` array with `useUsers(filters)` React Query hook
- Wire search input to `search` query parameter (server-side)
- Wire status/plan dropdowns to query parameters
- Add server-side pagination (shadcn Pagination component)
- Wire action menu buttons to mutation hooks:
  - "Edit Plan" → dialog with plan dropdown → `useUpdatePlan()`
  - "Edit Status" → dialog with status dropdown → `useUpdateStatus()`
  - "Edit Dates" → dialog with date pickers → `useUpdateDates()`
  - "Block/Unblock" → confirmation dialog → `useBlockUser()` / `useUnblockUser()`
  - NEW: "Send Message" → dialog with textarea → `useSendMessage()`
- Add confirmation dialogs (shadcn AlertDialog) before destructive actions
- Add loading skeletons while data fetches
- Add error toasts on failure
- Add a user detail slide-out panel showing recent chat history

#### B1.4 Column Mapping (subscriptions → table)

| Dashboard Column | DB Field | Notes |
|-----------------|----------|-------|
| User ID | `whatsapp_number` | Display as formatted phone |
| Status | `status` | Badge: active (green), expired (yellow), blocked (red) |
| Plan | `plan_name` | "Trial", "Subscription Start", "50 credits", etc. |
| Type | `is_recurring` | "Subscription" or "Prepaid" |
| Credits | `credits` | Current balance |
| Messages | `message_count` | Total questions asked |
| Start Date | `subscription_start` | |
| End Date | `subscription_end` | Red if past |
| Trial | `is_trial` | Badge if true |

#### B1.5 Deliverables

- [ ] FastAPI: all user CRUD endpoints with audit logging
- [ ] FastAPI: expiry enforcement cron job
- [ ] React: `useUsers`, `useUpdatePlan`, `useUpdateStatus`, `useBlockUser`, etc.
- [ ] React: updated `UsersPage.tsx` — real data, pagination, dialogs, loading/error states
- [ ] React: user detail panel with chat history

---

### B2. Role-Based Access Control (Week 2, parallel with B1)

**Current state:** Login.tsx navigates to dashboard without any validation.

#### B2.1 Auth Flow

**Backend:**
- `POST /admin/auth/login` — accepts email + password, returns JWT with `{ admin_id, role, email }`
- `GET /admin/auth/me` — returns current admin user from JWT
- JWT secret stored as env var on Render
- Passwords hashed with bcrypt

**Frontend:**
- Rewrite `Login.tsx` to call `auth.service.login(email, password)`
- On success: store JWT in memory (not localStorage for security), navigate to `/dashboard`
- On failure: show error toast, stay on login page
- Create `AuthProvider` context wrapping the app
- Create `ProtectedRoute` component checking auth state

#### B2.2 Role Permissions

| Action | Admin | Support |
|--------|-------|---------|
| View users | Yes | Yes |
| View chat history | Yes | Yes |
| Edit plan/status/dates | Yes | No |
| Block/unblock users | Yes | No |
| Send manual messages | Yes | Yes |
| View usage analytics | Yes | Yes |
| View refusals | Yes | Yes |
| View audit log | Yes | Yes (own actions only) |
| View/resolve alerts | Yes | Yes |
| Edit alert config | Yes | No |
| Access monitoring | Yes | No |

#### B2.3 Frontend Guards

- `ProtectedRoute` — redirects to `/login` if no JWT
- In `UsersPage.tsx` — hide mutation buttons for support role
- In sidebar (`DashboardLayout.tsx`) — hide admin-only nav items
- Add role badge next to username in header
- Wire logout button to clear JWT + navigate to `/login`

#### B2.4 Deliverables

- [ ] FastAPI: auth endpoints (login, me) with JWT
- [ ] FastAPI: role-checking dependency for admin-only endpoints
- [ ] React: `AuthProvider` context + `useAuth` hook
- [ ] React: `ProtectedRoute` component
- [ ] React: rewritten `Login.tsx` with real auth
- [ ] React: role-aware sidebar and action buttons
- [ ] React: working logout

---

### B3. Usage & Cost Analytics (Week 3)

**Current state:** `UsageCost.tsx` shows hardcoded charts.

**Key insight:** The `chat_logs` table already stores every message. We can aggregate it directly. What's missing is **token/cost tracking per message**.

#### B3.1 Add Token Tracking to Chatbot

In `whatsapp-chatbot/app/services/rag.py`, after the LLM call:

```python
# The ChatOpenAI response includes token usage in the response metadata
response = answer_chain.invoke({...})

# Extract from LangChain's response metadata
token_usage = response.response_metadata.get("token_usage", {})
prompt_tokens = token_usage.get("prompt_tokens", 0)
completion_tokens = token_usage.get("completion_tokens", 0)

# Calculate cost (gpt-4o-mini pricing)
cost_usd = (prompt_tokens * 0.00015 / 1000) + (completion_tokens * 0.0006 / 1000)
```

#### B3.2 Extend chat_logs Table

```sql
ALTER TABLE chat_logs ADD COLUMN prompt_tokens INTEGER DEFAULT 0;
ALTER TABLE chat_logs ADD COLUMN completion_tokens INTEGER DEFAULT 0;
ALTER TABLE chat_logs ADD COLUMN cost_usd DECIMAL(10,6) DEFAULT 0;
ALTER TABLE chat_logs ADD COLUMN model VARCHAR(50) DEFAULT 'gpt-4o-mini';
```

#### B3.3 Backend: Aggregation Endpoints

```python
# GET /admin/usage/summary?from=2026-04-01&to=2026-04-29
# Query:
#   SELECT
#     COUNT(*) as total_messages,
#     COUNT(DISTINCT whatsapp_number) as active_users,
#     SUM(prompt_tokens) as total_prompt_tokens,
#     SUM(completion_tokens) as total_completion_tokens,
#     SUM(cost_usd) as total_cost
#   FROM chat_logs
#   WHERE created_at BETWEEN :from AND :to
#     AND response_type = 'answered'

# GET /admin/usage/daily?from=...&to=...
# Query: GROUP BY DATE(created_at) → per-day totals

# GET /admin/usage/per-user?from=...&to=...
# Query: GROUP BY whatsapp_number → per-user rollup
```

#### B3.4 Frontend Changes

- Replace mock data in `UsageCost.tsx` with `useUsage(dateRange)` hook
- Add date range picker (shadcn Calendar + Popover)
- Replace inline-styled bar charts with **Recharts** (already installed):
  - `BarChart` for daily message volume
  - `LineChart` for daily cost trend
  - `AreaChart` for token usage over time
- Add export-to-CSV button for per-user table
- Update `Dashboard.tsx` stat cards with real data:
  - Total Users → `SELECT COUNT(*) FROM subscriptions`
  - Active Subscriptions → `WHERE status = 'active' AND is_trial = FALSE`
  - Messages Today → `SELECT COUNT(*) FROM chat_logs WHERE DATE(created_at) = TODAY`
  - Est. Cost Today → `SELECT SUM(cost_usd) FROM chat_logs WHERE DATE(created_at) = TODAY`

#### B3.5 Deliverables

- [ ] Chatbot: token/cost logging in rag.py after each LLM call
- [ ] SQL: ALTER chat_logs to add token/cost columns
- [ ] FastAPI: usage aggregation endpoints
- [ ] React: `useUsage` hooks with date range
- [ ] React: updated `UsageCost.tsx` with Recharts + date picker
- [ ] React: updated `Dashboard.tsx` with real stat cards

---

### B4. Refusal Analytics (Week 3, parallel with B3)

**Current state:** `Refusals.tsx` shows 5 hardcoded categories.

**Key insight:** Refusals are already captured — `chat_logs.response_type = 'refused'`. The `user_message` column contains the question that was refused. We just need to group and display them.

#### B4.1 Backend: Refusal Endpoints

```python
# GET /admin/refusals/grouped?from=...&to=...
# Query:
#   SELECT user_message, COUNT(*) as count, MAX(created_at) as latest
#   FROM chat_logs
#   WHERE response_type = 'refused'
#     AND created_at BETWEEN :from AND :to
#   GROUP BY user_message
#   ORDER BY count DESC
#
# For smarter grouping: use OpenAI embeddings to cluster similar refusals
# into categories (Supplements, Medical, Off-topic, etc.)
# OR: add a 'refusal_category' column and classify on insert

# GET /admin/refusals/trend?from=...&to=...
# Query:
#   SELECT DATE(created_at), COUNT(*) as refusals,
#     (SELECT COUNT(*) FROM chat_logs WHERE DATE(created_at) = d) as total
#   → refusal_rate = refusals / total

# GET /admin/refusals/list?category=...&page=1
# Paginated list of individual refused questions
```

#### B4.2 Refusal Categorization

Two approaches (pick one):

**Simple (recommended for now):** Add a `refusal_category` column to `chat_logs`. In the chatbot's RAG pipeline, when a refusal is detected, classify it:

```python
categories = ["supplements", "medical_advice", "injury", "off_topic", "weight_loss_drugs"]
# Use a simple keyword match or a quick LLM call to categorize
```

**Advanced (later):** Embed refused questions, cluster by similarity, let admins name the clusters.

#### B4.3 Frontend Changes

- Replace mock data with `useRefusals(dateRange)` hook
- Show grouped refusals with counts (already designed in UI)
- Add trend chart: refusal rate over time (Recharts LineChart)
- Add date range filter
- Add "Convert to FAQ" button on individual refusals (prep for Stage D)

#### B4.4 Deliverables

- [ ] SQL: add `refusal_category` column to chat_logs
- [ ] Chatbot: classify refusals on insert
- [ ] FastAPI: refusal grouping + trend endpoints
- [ ] React: `useRefusals` hooks
- [ ] React: updated `Refusals.tsx` with real data + trend chart

---

### B5. Audit Log (Week 4)

**Current state:** `AuditLog.tsx` shows 6 hardcoded entries.

**Key insight:** The `audit_events` table was created in B0. Every mutation in B1 already inserts audit events. This stage is just the frontend read + filtering.

#### B5.1 Backend: Audit Endpoint

```python
# GET /admin/audit?actor=&action=&from=&to=&page=1&per_page=50
# Query: SELECT * FROM audit_events WHERE ... ORDER BY created_at DESC
# Returns: { events: [...], total: 1205, page: 1, pages: 25 }
```

#### B5.2 Frontend Changes

- Replace mock data with `useAuditLog(filters)` hook
- Add filters: date range, actor dropdown (populated from distinct actors), action type dropdown
- Server-side pagination
- Export-to-CSV
- Display timestamps in admin's local timezone

#### B5.3 Deliverables

- [ ] FastAPI: paginated audit query endpoint
- [ ] React: `useAuditLog` hook
- [ ] React: updated `AuditLog.tsx` with real data, filters, pagination, export

---

### B6. Alerts (Week 4, parallel with B5)

**Current state:** `AlertsPage.tsx` shows 4 hardcoded alerts.

#### B6.1 Alert Detection Engine

Add to the chatbot's scheduled jobs (APScheduler):

```python
# Runs every hour
def check_alert_conditions():
    config = load_alert_config()
    
    # 1. Spend Spike: total cost today > threshold
    today_cost = db.query(func.sum(ChatLog.cost_usd)).filter(
        func.date(ChatLog.created_at) == date.today()
    ).scalar()
    if config['spend_spike'].enabled and today_cost > config['spend_spike'].threshold:
        create_alert('spend_spike', 'high', f"Daily spend ${today_cost:.2f} exceeds ${config['spend_spike'].threshold}")
    
    # 2. User near credit limit: credits <= 3
    low_credit_users = db.query(Subscription).filter(
        Subscription.status == 'active',
        Subscription.credits <= 3,
        Subscription.credits > 0
    ).all()
    for user in low_credit_users:
        create_alert('message_limit', 'medium', f"User {user.whatsapp_number} has {user.credits} credits left")
    
    # 3. High refusal rate: refusals/total > threshold in last 24h
    recent = db.query(ChatLog).filter(ChatLog.created_at >= datetime.utcnow() - timedelta(hours=24))
    total = recent.count()
    refusals = recent.filter(ChatLog.response_type == 'refused').count()
    if total > 0 and (refusals / total) > config['high_refusal_rate'].threshold:
        create_alert('high_refusal_rate', 'medium', f"Refusal rate {refusals/total*100:.1f}% in last 24h")
    
    # 4. Expiry warnings: subscription_end within 3 days
    soon = db.query(Subscription).filter(
        Subscription.status == 'active',
        Subscription.subscription_end.between(datetime.utcnow(), datetime.utcnow() + timedelta(days=3))
    ).all()
    for user in soon:
        create_alert('expiry_warning', 'low', f"User {user.whatsapp_number} expires in {days} days")
```

#### B6.2 Frontend Changes

- Replace mock data with `useAlerts()` hook
- Add "Resolve" button → `PATCH /admin/alerts/:id/resolve` + audit event
- Add notification badge on "Alerts" nav link (count of active alerts)
- NEW page: `/alert-config` (admin only) for managing thresholds
- Optional: poll for new alerts every 30 seconds, or use server-sent events

#### B6.3 Deliverables

- [ ] Chatbot: alert detection scheduled job (hourly)
- [ ] Chatbot: alert_config CRUD endpoints
- [ ] FastAPI: alerts list/resolve endpoints
- [ ] React: `useAlerts` hook with polling
- [ ] React: updated `AlertsPage.tsx` with real data + resolve action
- [ ] React: alert badge on nav link
- [ ] React: `AlertConfig.tsx` page (admin only)

---

## Stage C — Cost & Reliability Controls

**Goal:** Protect against runaway costs and ensure messages don't get lost.

**Estimated effort:** 2–3 weeks

**Prerequisite:** B3 (token tracking) must be complete.

---

### C1. Per-Plan Limits & Throttling (Week 5)

**Current state:** The chatbot already has credit-based limits (`verify_subscription` checks `credits >= 1`). What's missing is rate limiting and token budgets.

#### C1.1 What Already Works

- Credit deduction per message: yes (1 credit per answered question)
- Plan-based credit allocation: yes (75/150/300 for subscriptions, 50/100 for prepaid)
- Trial limits: yes (15 credits, 7 days)
- Subscription expiry: yes (checked in verify_subscription)

#### C1.2 What Needs Adding

**Rate limiting** — prevent a single user from spamming 50 messages per minute:

```python
# In whatsapp.py, before handle_rag_and_reply:
from datetime import timedelta

recent_count = db.query(ChatLog).filter(
    ChatLog.whatsapp_number == sender,
    ChatLog.created_at >= datetime.utcnow() - timedelta(minutes=1)
).count()

if recent_count >= RATE_LIMIT_PER_MINUTE:  # e.g., 10
    await send_whatsapp_message(sender, "You're sending messages too fast. Please wait a moment.")
    return
```

For production scale, use Redis or an in-memory counter instead of a DB query.

**Daily token budget per user** (optional, prevents one user from burning all the OpenAI budget):

```python
daily_tokens = db.query(func.sum(ChatLog.prompt_tokens + ChatLog.completion_tokens)).filter(
    ChatLog.whatsapp_number == sender,
    func.date(ChatLog.created_at) == date.today()
).scalar()

if daily_tokens and daily_tokens > MAX_DAILY_TOKENS:
    await send_whatsapp_message(sender, "You've reached your daily usage limit. Try again tomorrow.")
    return
```

**Global daily spend cap** — if total OpenAI cost today exceeds a threshold, pause all non-essential responses:

```python
total_today = db.query(func.sum(ChatLog.cost_usd)).filter(
    func.date(ChatLog.created_at) == date.today()
).scalar()

if total_today and total_today > DAILY_SPEND_CAP:
    # Create alert + respond with cached FAQ if possible, else apologize
```

#### C1.3 Dashboard: Plan Management

New page `/plans` (admin only) showing:
- All plan types with their credit allocation and pricing
- Number of active users on each plan
- Edit plan parameters (if plans are stored in DB; currently they're hardcoded in `payment_logic.py`)

#### C1.4 Deliverables

- [ ] Chatbot: rate limiting per user (messages per minute)
- [ ] Chatbot: optional daily token budget per user
- [ ] Chatbot: global daily spend cap with alert
- [ ] Chatbot: configurable rate limit values via env vars
- [ ] React: plan overview page

---

### C2. Queue & Retry (Week 5–6)

**Current state:** Messages are processed in a FastAPI `BackgroundTask`. If the OpenAI API is down or slow, the message is lost.

#### C2.1 Problem

The current flow:
```
WhatsApp webhook → BackgroundTask(handle_rag_and_reply) → Call OpenAI → Send reply
```

If OpenAI returns a 500 or times out, the `handle_rag_and_reply` function catches the exception, logs it, and sends an error message to the user. The question is lost — the user has to re-ask.

#### C2.2 Solution: Simple DB-Backed Queue

```sql
CREATE TABLE message_queue (
  id              SERIAL PRIMARY KEY,
  whatsapp_number VARCHAR(20) NOT NULL,
  user_message    TEXT NOT NULL,
  is_first        BOOLEAN DEFAULT FALSE,
  status          VARCHAR(20) DEFAULT 'pending',  -- pending | processing | completed | failed
  attempts        INTEGER DEFAULT 0,
  max_retries     INTEGER DEFAULT 3,
  next_retry_at   TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);
```

#### C2.3 New Flow

```
WhatsApp webhook
  → Insert into message_queue (status='pending')
  → Return 200 to Meta immediately

Background worker (APScheduler, every 5 seconds):
  → SELECT * FROM message_queue WHERE status='pending' OR (status='failed' AND attempts < max_retries AND next_retry_at <= NOW())
  → For each: set status='processing', call handle_rag_and_reply
  → On success: set status='completed'
  → On failure: set status='failed', attempts++, next_retry_at = NOW() + 2^attempts seconds
  → After max_retries: send apology message to user, create alert
```

#### C2.4 Deliverables

- [ ] SQL: message_queue table
- [ ] Chatbot: insert into queue instead of BackgroundTask
- [ ] Chatbot: queue worker with exponential backoff
- [ ] Chatbot: dead-letter handling (max retries exceeded → alert)
- [ ] Dashboard: queue depth visible on monitoring page

---

### C3. Monitoring (Week 6)

**Current state:** Only a basic `/health` endpoint returning `{"status": "ok"}`.

#### C3.1 Enhanced Health Endpoint

```python
# GET /admin/health
{
  "status": "ok",
  "database": {"connected": true, "latency_ms": 12},
  "openai_api": {"reachable": true, "latency_ms": 340},
  "whatsapp_api": {"reachable": true},
  "queue_depth": 3,
  "active_users_today": 47,
  "messages_today": 312,
  "cost_today_usd": 1.85,
  "uptime_seconds": 259200,
  "last_message_at": "2026-04-29T14:32:00Z"
}
```

#### C3.2 Monitoring Dashboard Page

New page `/monitoring` (admin only):
- Real-time health panel (poll every 10 seconds)
- Queue depth gauge
- Message throughput (messages/hour chart)
- API latency trends
- Error rate
- Cost burn rate (projected daily cost based on current pace)

#### C3.3 External Uptime

Set up a free uptime monitor (UptimeRobot, Better Stack) pinging `/health` every minute.

#### C3.4 Deliverables

- [ ] FastAPI: enhanced `/admin/health` endpoint
- [ ] React: `MonitoringPage.tsx` with real-time health display
- [ ] External uptime monitoring setup

---

## Stage D — Buddy Experience Enhancements

**Goal:** Improve the chatbot's conversation quality and add knowledge management features accessible from the dashboard.

**Estimated effort:** 4–5 weeks

**Prerequisite:** Stages B + C complete.

**Note:** The core conversation engine already exists and works. Stage D is about making it smarter and giving admins control over its knowledge.

---

### D1. System Prompt Management (Week 7)

**Current state:** The system prompt is hardcoded in `rag.py` as a Python string. Changing it requires a code deploy.

#### D1.1 Move Prompts to Database

```sql
CREATE TABLE prompt_templates (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(100) UNIQUE NOT NULL,  -- 'answer_prompt', 'intent_prompt', 'rewrite_prompt'
  template        TEXT NOT NULL,
  version         INTEGER DEFAULT 1,
  is_active       BOOLEAN DEFAULT TRUE,
  created_by      INTEGER REFERENCES admin_users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ
);
```

The RAG pipeline loads active prompts on startup and caches them. An admin endpoint allows updating prompts, which triggers a cache refresh.

#### D1.2 Dashboard: Prompt Editor

New page `/prompts` (admin only):
- List all prompt templates
- Edit with a rich text area (with variable highlighting for `{context}`, `{chat_history}`, etc.)
- Version history (previous versions stored, can roll back)
- "Test" button: send a sample question and see the response with the new prompt before activating

#### D1.3 Deliverables

- [ ] SQL: prompt_templates table with seed data (current prompts)
- [ ] Chatbot: load prompts from DB with caching
- [ ] Chatbot: cache refresh endpoint
- [ ] FastAPI: prompt CRUD endpoints
- [ ] React: `PromptsPage.tsx` with editor and version history

---

### D2. Conversation Memory Improvements (Week 7–8)

**Current state:** Last 10 chat_logs per user are kept. Refusals are filtered from history. Follow-up works via query rewriting.

#### D2.1 Long-Term User Memory

Extract persistent facts from conversations:

```sql
CREATE TABLE user_memory (
  id              SERIAL PRIMARY KEY,
  whatsapp_number VARCHAR(20) NOT NULL,
  fact            TEXT NOT NULL,              -- "User is training for a marathon"
  source_log_id   INTEGER REFERENCES chat_logs(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_user_mem (whatsapp_number)
);
```

After each answered message, run a lightweight LLM call:
```
"Extract any personal facts about the user from this exchange that would be useful for future nutrition advice. Return JSON array of facts or empty array."
```

Include relevant memories in the system prompt for future conversations.

#### D2.2 Memory Management in Dashboard

New section on the user detail panel:
- View stored memories per user
- Delete incorrect memories
- Memories are also visible in the chat history view

#### D2.3 Deliverables

- [ ] SQL: user_memory table
- [ ] Chatbot: fact extraction after each message
- [ ] Chatbot: inject memories into system prompt
- [ ] FastAPI: memory CRUD endpoints
- [ ] React: memory section on user detail panel

---

### D3. FAQ System (Week 8–9)

**Current state:** No FAQ system. Every question hits the LLM.

#### D3.1 FAQ Database

```sql
CREATE TABLE faqs (
  id              SERIAL PRIMARY KEY,
  question        TEXT NOT NULL,
  answer          TEXT NOT NULL,
  category        VARCHAR(100),
  embedding       vector(1536),
  language        VARCHAR(5) DEFAULT 'nl',     -- nl | en
  use_count       INTEGER DEFAULT 0,
  created_by      INTEGER REFERENCES admin_users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ
);
```

#### D3.2 FAQ Matching Pipeline

In the RAG pipeline, before calling the LLM:

```python
# 1. Embed the user's question
query_embedding = embeddings.embed_query(rewritten_query)

# 2. Search FAQs by cosine similarity
faq_match = db.execute("""
    SELECT *, 1 - (embedding <=> :query_vec) as similarity
    FROM faqs
    WHERE 1 - (embedding <=> :query_vec) > 0.92
    ORDER BY similarity DESC
    LIMIT 1
""")

# 3. If high-confidence match: return FAQ answer directly (zero LLM cost)
if faq_match and faq_match.similarity > 0.92:
    faq_match.use_count += 1
    return faq_match.answer  # Skip LLM entirely
```

This directly saves money — frequent questions get free answers.

#### D3.3 FAQ Population

Three sources:
1. **Manual:** Admins create FAQs from dashboard
2. **From refusals:** "Convert to FAQ" button on refusals page (B4) — admin writes the answer the bot should give
3. **Auto-suggested:** Analyze frequent questions (cluster by embedding similarity), suggest FAQ candidates for admin review

#### D3.4 Dashboard: FAQ Management

New page `/faqs` (admin only):
- CRUD for FAQs
- Usage stats (how often each FAQ is matched)
- "Suggested FAQs" tab from frequent question clustering
- Import from refusals

#### D3.5 Deliverables

- [ ] SQL: faqs table with pgvector
- [ ] Chatbot: FAQ matching in RAG pipeline (before LLM call)
- [ ] Chatbot: auto-suggest FAQ candidates
- [ ] FastAPI: FAQ CRUD endpoints
- [ ] React: `FAQPage.tsx` with management UI

---

### D4. Knowledge Base Management (Week 9–10)

**Current state:** Book ingestion is done via `scripts/ingest_book.py` CLI script. Admins can't manage the knowledge base from the dashboard.

#### D4.1 Dashboard: Knowledge Base Page

New page `/knowledge-base` (admin only):

- View all chunks in the vector store with metadata (page, section, chunk_index)
- Search chunks by text or semantic similarity
- Upload new documents (PDF, TXT) → trigger ingestion pipeline
- Delete individual chunks or entire documents
- See which chunks are cited most frequently (from chat_logs.chunks_used)
- Re-ingest: re-process a document with updated chunking parameters

#### D4.2 Backend: Ingestion API

Expose the ingestion script as an API endpoint:

```python
# POST /admin/knowledge-base/upload
# Accepts: multipart file (PDF, TXT, DOCX)
# Action: Run ingest pipeline → chunk → embed → store in pgvector

# GET /admin/knowledge-base/chunks?search=&page=1
# Returns: paginated chunks with metadata

# DELETE /admin/knowledge-base/chunks/:uuid
# Removes a single chunk from the vector store

# GET /admin/knowledge-base/stats
# Returns: total chunks, total documents, most-cited chunks
```

#### D4.3 Citation Tracking

The chatbot already stores `chunks_used` in chat_logs. Aggregate this to show which parts of the book are most referenced:

```python
# GET /admin/knowledge-base/citations
# Query: Flatten chunks_used JSON across all chat_logs, count by page/section
```

#### D4.4 Deliverables

- [ ] FastAPI: knowledge base CRUD + upload endpoints
- [ ] FastAPI: citation aggregation endpoint
- [ ] React: `KnowledgeBasePage.tsx` with chunk viewer, search, upload, stats

---

## Stage E — Personalized Nutrition

**Goal:** Add user profiling, macro calculations, meal suggestions, and coaching to the chatbot.

**Estimated effort:** 5–6 weeks

**Prerequisite:** Stage D complete (memory system needed for profile persistence).

---

### E1. User Profile & Onboarding (Week 11–12)

#### E1.1 Profile Data

```sql
CREATE TABLE user_profiles (
  id                  SERIAL PRIMARY KEY,
  whatsapp_number     VARCHAR(20) UNIQUE NOT NULL,
  age                 INTEGER,
  gender              VARCHAR(20),
  weight_kg           DECIMAL(5,2),
  height_cm           DECIMAL(5,2),
  activity_level      VARCHAR(20),        -- sedentary | light | moderate | active | very_active
  sport               VARCHAR(100),
  training_frequency  INTEGER,            -- sessions/week
  goals               TEXT[],             -- muscle_gain, endurance, weight_loss, recovery
  dietary_restrictions TEXT[],            -- vegetarian, vegan, gluten_free, lactose_free, halal
  allergies           TEXT[],
  preferred_cuisines  TEXT[],
  budget_level        VARCHAR(20),        -- low | medium | high
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ
);
```

#### E1.2 Conversational Onboarding

On a new user's first message (after the welcome), the bot asks a sequence of questions to build their profile. The responses are parsed by the LLM into structured fields and stored in `user_profiles`.

Users can update their profile anytime: "I've switched to plant-based" → bot detects profile update intent → updates the field.

#### E1.3 Dashboard: Profile Viewer

Add to the user detail panel:
- View profile data (read-only for now)
- Admin can manually edit profile fields

#### E1.4 Deliverables

- [ ] SQL: user_profiles table
- [ ] Chatbot: onboarding conversation flow
- [ ] Chatbot: profile extraction from conversational input
- [ ] Chatbot: profile update detection
- [ ] Chatbot: inject profile into system prompt for personalized answers
- [ ] FastAPI: profile read/update endpoints
- [ ] React: profile section on user detail panel

---

### E2. Macro Calculation Engine (Week 12)

#### E2.1 Deterministic Calculator

Not LLM-generated — pure math for consistency:

```python
def calculate_macros(profile: UserProfile) -> MacroTargets:
    # BMR (Mifflin-St Jeor)
    if profile.gender == 'male':
        bmr = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age + 5
    else:
        bmr = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age - 161
    
    # TDEE
    multipliers = {'sedentary': 1.2, 'light': 1.375, 'moderate': 1.55, 'active': 1.725, 'very_active': 1.9}
    tdee = bmr * multipliers[profile.activity_level]
    
    # Goal adjustment
    if 'weight_loss' in profile.goals: tdee -= 400
    elif 'muscle_gain' in profile.goals: tdee += 350
    
    # Macro split (sport-specific)
    # Endurance: 55/25/20, Strength: 40/35/25, General: 45/30/25
    ...
    
    return MacroTargets(calories, protein_g, carbs_g, fat_g, water_ml)
```

The buddy references these targets when giving advice: "Based on your profile, you need about 140g protein daily..."

#### E2.2 Deliverables

- [ ] `app/services/macros.py` — deterministic macro calculator
- [ ] Unit tests covering all sport/goal/activity combos
- [ ] Chatbot: include macro targets in personalized answers
- [ ] FastAPI: endpoint to get/recalculate macros
- [ ] React: macro targets visible on user profile panel

---

### E3. Meal Suggestions & Recipes (Week 13–14)

#### E3.1 Meal Template Database

```sql
CREATE TABLE meal_templates (
  id                  SERIAL PRIMARY KEY,
  name                TEXT NOT NULL,
  meal_type           VARCHAR(20),        -- breakfast | lunch | dinner | snack | pre_workout | post_workout
  ingredients         JSONB,
  total_macros        JSONB,              -- {calories, protein, carbs, fat}
  prep_time_minutes   INTEGER,
  dietary_tags        TEXT[],
  cuisine             VARCHAR(50),
  budget_level        VARCHAR(20),
  instructions        TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

Seed with 100–200 athlete-focused meals. The bot selects meals matching the user's profile (dietary restrictions, goals, budget) and adjusts portions to hit macro targets.

#### E3.2 Dashboard: Meal Management

New page `/meals` (admin only):
- CRUD for meal templates
- Bulk import from CSV
- Tag management
- Usage stats (which meals are suggested most)

#### E3.3 Deliverables

- [ ] SQL: meal_templates table + seed data
- [ ] Chatbot: meal matching algorithm (profile → eligible meals → rank)
- [ ] Chatbot: portion adjustment to hit macro targets
- [ ] FastAPI: meal template CRUD endpoints
- [ ] React: `MealsPage.tsx` management UI

---

### E4. Progress Tracking (Week 15)

#### E4.1 Daily Logs

```sql
CREATE TABLE daily_logs (
  id              SERIAL PRIMARY KEY,
  whatsapp_number VARCHAR(20) NOT NULL,
  date            DATE NOT NULL,
  weight_kg       DECIMAL(5,2),
  meals           JSONB,
  water_ml        INTEGER,
  training        JSONB,
  energy_level    INTEGER,          -- 1-10
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(whatsapp_number, date)
);
```

Users log through conversation: "I had oatmeal with banana for breakfast" → buddy extracts meal data, estimates macros, stores the log.

#### E4.2 Dashboard: Progress Viewer

Add to user detail panel:
- Weekly macro adherence chart (actual vs. target)
- Weight trend graph
- Training consistency calendar

#### E4.3 Deliverables

- [ ] SQL: daily_logs table
- [ ] Chatbot: conversational log extraction
- [ ] Chatbot: meal → macro estimation
- [ ] FastAPI: progress aggregation endpoints
- [ ] React: progress charts on user detail panel

---

### E5. Adaptive Coaching (Week 16)

#### E5.1 Coaching Rules Engine

```sql
CREATE TABLE coaching_rules (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(100),
  condition       JSONB,              -- {metric: 'protein_avg_7d', operator: '<', value: 0.8}
  message_nl      TEXT,
  message_en      TEXT,
  cooldown_days   INTEGER DEFAULT 7,
  enabled         BOOLEAN DEFAULT TRUE
);
```

A daily job checks each active user against coaching rules. If triggered, send a proactive WhatsApp message.

Example rules:
- No log in 2 days → "Hey! Haven't heard from you — want meal suggestions for today?"
- Protein consistently low → "Your protein has been below target this week. Here are some easy fixes."
- Training day → "Big training day! Here's a pre-workout snack idea."

#### E5.2 Dashboard: Coaching Rules

New page `/coaching` (admin only):
- CRUD for coaching rules
- Enable/disable toggles
- View trigger history (when was each rule last triggered, for whom)

#### E5.3 Deliverables

- [ ] SQL: coaching_rules table + seed rules
- [ ] Chatbot: daily coaching check job
- [ ] Chatbot: proactive WhatsApp message sending
- [ ] FastAPI: coaching rules CRUD
- [ ] React: `CoachingPage.tsx`

---

### E6. Supplement Guidance (Week 16, parallel with E5)

**Current state:** Supplements are sometimes refused by the bot (one of the top refusal categories).

#### E6.1 Approach

Don't build a separate feature — expand the RAG knowledge base:

1. Add vetted supplement content to the knowledge base (via the D4 upload system)
2. Refine the system prompt to allow general supplement discussion within guardrails
3. Define clear boundaries in the prompt:
   - Allowed: general info, timing, food-first recommendations
   - Not allowed: brand names, medical dosages, interactions with medication

#### E6.2 Deliverables

- [ ] Knowledge base: vetted supplement documents uploaded via D4 system
- [ ] Prompt: updated supplement guardrails
- [ ] Testing: 20+ supplement edge cases verified

---

## Implementation Timeline

```
Week 01      │  B0: Foundation (DB tables, admin router, API layer, auth middleware, strict TS)
Week 02      │  B1 + B2: User management (real data) + RBAC (real login)
Week 03      │  B3 + B4: Usage analytics (token tracking) + Refusal analytics
Week 04      │  B5 + B6: Audit log + Alerts engine
Week 05      │  C1 + C2: Rate limiting + Message queue with retry
Week 06      │  C3: Monitoring dashboard + integration testing B+C
Week 07-08   │  D1 + D2: Prompt management + Long-term memory
Week 08-09   │  D3: FAQ system (saves LLM costs)
Week 09-10   │  D4: Knowledge base management from dashboard
Week 11-12   │  E1 + E2: User profiles + Macro calculator
Week 13-14   │  E3: Meal templates + suggestions
Week 15      │  E4: Progress tracking
Week 16      │  E5 + E6: Adaptive coaching + Supplement guidance
```

**Total: ~16 weeks (4 months)** — 8 weeks shorter than the v1 roadmap because the backend already exists.

Each stage ships independently. After Stage B alone, you have a fully functional admin dashboard reading live production data.

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Neon connection limits | Medium | Connection pooling already configured (pool_recycle=300). Dashboard uses separate pool. Monitor active connections in C3. |
| OpenAI cost spikes | High | Token tracking (B3), rate limiting (C1), FAQ cache (D3), daily spend cap (C1), alerts (B6) |
| OpenAI API downtime | High | Queue & retry (C2), FAQ fallback (D3), monitoring (C3) |
| Dashboard slows down chatbot | Medium | Separate connection pool for admin queries. Heavy aggregation queries use read replicas (Neon supports this). |
| Schema migrations break chatbot | High | Always use `ALTER TABLE ... ADD COLUMN ... DEFAULT` (non-breaking). Test migrations on Neon branch first. |
| Prompt changes break responses | Medium | Prompt versioning (D1) with rollback. "Test" button before activating. |

---

## Changes Between Repos

For clarity, here's what gets modified where:

### Changes to `whatsapp-chatbot` (FastAPI backend)

- New: `app/api/admin/` — all admin endpoints
- New: `app/middleware/admin_auth.py` — JWT auth
- Modified: `app/db/models.py` — new tables (admin_users, audit_events, alerts, etc.)
- Modified: `app/services/rag.py` — token logging, FAQ matching, memory extraction
- Modified: `app/main.py` — register admin router, new scheduled jobs
- New scheduled jobs: expiry enforcement, alert detection, coaching checks

### Changes to `atleet-buddy-hub` (React dashboard)

- New: `src/types/` — all TypeScript interfaces
- New: `src/services/` — API client + service files
- New: `src/hooks/` — React Query hooks
- New: `src/components/ProtectedRoute.tsx`
- New: `src/contexts/AuthContext.tsx`
- Modified: every page in `src/pages/` — replace mock data with real hooks
- New pages: AlertConfig, Monitoring, Prompts, FAQs, KnowledgeBase, Meals, Coaching

---

## Definition of Done (per feature)

1. Backend endpoint exists with input validation and error handling
2. Frontend is wired to real data (zero mock data remains for that feature)
3. Loading, error, and empty states are handled in the UI
4. Audit logging in place for all mutations
5. RBAC enforced (API rejects unauthorized roles; UI hides forbidden actions)
6. Works on mobile viewport (responsive)
7. No TypeScript errors with strict mode enabled

---

*This document should be reviewed and updated at the end of each stage as requirements evolve based on user feedback.*
