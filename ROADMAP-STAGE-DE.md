# Stage D+E Lite — Sell-Ready Buddy Enhancements

## Implementation Roadmap

**Objective:** Transform Atleet Buddy into a personalized, commercially ready product with user profiles, tailored responses, FAQ caching, better citations, and launch polish.

**Repos:**
- `whatsapp-chatbot` — Python FastAPI backend (Render + Neon PostgreSQL)
- `atleet-buddy-hub` — React TypeScript dashboard (Vercel)

**Current stack:** LangChain + OpenAI (gpt-4o-mini) + PGVector + FastAPI + SQLAlchemy

---

## D/E1. User Profile System

**Theory:** Currently the bot treats every user as anonymous — it only knows their WhatsApp number and chat history. By storing lightweight profile data (weight, height, age, goals, sport), the bot can personalize every response without the user repeating themselves.

**Approach:** Profile data is collected conversationally (the bot asks during the first interaction or when the user volunteers info) and stored in a new `user_profiles` table. The dashboard also gets a profile viewer so admins can see what each user has shared.

### D/E1.1 — Database: `user_profiles` table

**SQL migration (run on Neon):**
```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  whatsapp_number VARCHAR(20) UNIQUE NOT NULL REFERENCES subscriptions(whatsapp_number),
  weight_kg FLOAT,
  height_cm FLOAT,
  age INTEGER,
  goals TEXT,              -- e.g. "muscle gain", "weight loss", "endurance"
  sport TEXT,              -- e.g. "running", "cycling", "gym"
  dietary_preferences TEXT, -- e.g. "vegetarian", "no lactose"
  training_frequency TEXT, -- e.g. "4x per week"
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**SQLAlchemy model** — add to `app/db/models.py`:
```python
class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True)
    whatsapp_number = Column(String(20), ForeignKey("subscriptions.whatsapp_number"), unique=True, nullable=False)
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    age = Column(Integer, nullable=True)
    goals = Column(Text, nullable=True)
    sport = Column(Text, nullable=True)
    dietary_preferences = Column(Text, nullable=True)
    training_frequency = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

### D/E1.2 — Profile extraction service

**File:** `app/services/profile_extractor.py`

The bot already collects info conversationally (rule 6 in the system prompt says "If the user has shared personal info...use it"). This service parses messages to detect and save profile data automatically.

```python
# Pseudocode — lightweight LLM extraction
def extract_profile_fields(user_message: str, bot_response: str) -> dict:
    """
    Use a small prompt to extract structured profile data from conversation.
    Returns dict like {"weight_kg": 75, "sport": "running"} or empty dict.
    Only runs when message likely contains profile info (keyword check first).
    """
    keywords = ["weigh", "kg", "tall", "height", "years old", "age", "goal",
                "sport", "train", "vegetarian", "vegan", "run", "cycling",
                "gewicht", "lang", "jaar", "doel", "sport"]
    if not any(kw in user_message.lower() for kw in keywords):
        return {}
    # Small extraction prompt → parse JSON → return fields
```

**Integration point:** Called in `rag.py` step 6 (after ChatLog insert), saves/updates `user_profiles` row.

### D/E1.3 — Admin API: profile endpoints

**File:** `app/api/admin/users.py` — add to existing user detail endpoint

```python
# GET /admin/users/{whatsapp_number} already returns user detail
# Add profile data to the response:
# profile: { weight_kg, height_cm, age, goals, sport, dietary_preferences, training_frequency }
```

### D/E1.4 — Dashboard: profile display

**File:** `src/pages/UsersPage.tsx` — in the user detail sheet, add a "Profile" section showing the stored profile fields.

### Testing D/E1

1. Run the SQL migration on Neon
2. Send a WhatsApp message: "I'm 28 years old, weigh 75kg and I do cycling 3x per week"
3. Verify in Neon: `SELECT * FROM user_profiles WHERE whatsapp_number = '<your_number>';`
4. Check dashboard user detail sheet shows the profile data
5. Send another message: "I've changed my goal to weight loss" → verify profile updates

---

## D/E2. Tailored Responses

**Theory:** With profile data available, the system prompt can include user context so the LLM gives personalized answers. A 75kg cyclist asking about protein gets different advice than a 90kg weightlifter. This is the highest-impact change for user experience.

**Approach:** Inject profile context into the system prompt dynamically. No model change needed — just prompt engineering.

### D/E2.1 — Profile context injection in RAG pipeline

**File:** `app/services/rag.py` — modify `get_rag_response()`

```python
# Before building the answer prompt, load the user's profile:
profile = db.query(UserProfile).filter_by(whatsapp_number=whatsapp_number).first()

# Build a profile context string:
profile_context = ""
if profile:
    parts = []
    if profile.age: parts.append(f"Age: {profile.age}")
    if profile.weight_kg: parts.append(f"Weight: {profile.weight_kg}kg")
    if profile.height_cm: parts.append(f"Height: {profile.height_cm}cm")
    if profile.sport: parts.append(f"Sport: {profile.sport}")
    if profile.goals: parts.append(f"Goals: {profile.goals}")
    if profile.training_frequency: parts.append(f"Training: {profile.training_frequency}")
    if profile.dietary_preferences: parts.append(f"Diet: {profile.dietary_preferences}")
    if parts:
        profile_context = "User profile: " + ", ".join(parts)
```

### D/E2.2 — System prompt update

**File:** `app/services/rag.py` — add a new rule to `answer_system_prompt`:

```python
# Insert after rule 6 (PERSONALIZE FROM HISTORY):
"6b. **USE PROFILE DATA.** The user's stored profile is provided below. Use it to tailor "
"portions, recommendations, and examples. A 60kg endurance runner needs different advice "
"than a 90kg strength athlete. If their goal is weight loss, emphasize caloric context. "
"If their goal is muscle gain, emphasize protein timing and amounts. "
"Never repeat the profile back to the user — just use it naturally.\n"
```

Add the profile context as a system message in the prompt template:

```python
_answer_prompt = ChatPromptTemplate.from_messages([
    ("system", answer_system_prompt),
    ("system", "Context excerpts from the book:\n{context}"),
    ("system", "{profile_context}"),  # NEW — injected profile
    MessagesPlaceholder("chat_history"),
    ("human", "{input}")
])
```

### Testing D/E2

1. Set up a test user profile: `UPDATE user_profiles SET weight_kg=75, age=28, sport='cycling', goals='endurance' WHERE whatsapp_number='<number>';`
2. Ask: "How much protein do I need?" → response should reference cycling/endurance context
3. Update profile: `UPDATE user_profiles SET sport='weightlifting', goals='muscle gain' WHERE whatsapp_number='<number>';`
4. Ask the same question → response should now emphasize strength/muscle context
5. Compare both responses to verify personalization is working

---

## D/E3. Guided Practical Responses

**Theory:** Users want actionable advice, not textbook summaries. "Eat 1.6g protein per kg bodyweight" is less useful than "For you at 75kg, aim for about 120g protein per day — that's roughly 3 chicken breasts or 500g Greek yogurt spread across your meals."

**Approach:** Update the system prompt to encourage practical, structured, actionable answers with real examples from the book.

### D/E3.1 — System prompt enhancement

**File:** `app/services/rag.py` — modify existing rules:

```python
# Add new rule after existing rules:
"16. **PRACTICAL & ACTIONABLE.** Always make advice concrete and usable:\n"
"   - Convert abstract advice into specific actions (e.g. 'eat more protein' → 'add a handful of nuts to your morning oats')\n"
"   - When the book mentions quantities, relate them to common foods the user recognizes\n"
"   - If the user has a profile, calculate amounts for their specific weight/goals\n"
"   - Structure longer answers with clear steps or bullet points\n"
"   - Prefer 'try this' over 'you should' — keep the friendly buddy tone\n"

"17. **EXAMPLE-DRIVEN.** When the book provides examples, recipes, or sample meals, "
"lead with those rather than abstract principles. Users remember concrete examples better "
"than rules. If the book mentions 'Chunky Monkey oats' as a pre-workout meal, say that "
"specifically rather than 'a carbohydrate-rich breakfast'.\n"
```

### Testing D/E3

1. Ask: "What should I eat before training?" → should get specific food examples from the book, not just "eat carbs"
2. Ask: "How do I recover after a long run?" → should get step-by-step practical advice
3. Compare response quality against pre-change responses (save a few before/after examples)

---

## D/E4. Meal & Example Suggestions

**Theory:** Meal suggestions are the #1 most-requested feature in nutrition chatbots. Users want specific food ideas they can actually make, not just macronutrient targets. The book contains recipes and meal ideas — the bot should surface them proactively.

**Approach:** Enhance the system prompt to encourage meal suggestions and create a meal-specific retrieval strategy.

### D/E4.1 — Meal-aware system prompt

**File:** `app/services/rag.py` — add rule:

```python
"18. **MEAL SUGGESTIONS.** When the user asks about meals, snacks, or 'what to eat':\n"
"   - Suggest specific foods/meals from the book excerpts, not categories\n"
"   - Include practical details: ingredients and rough portions when the book provides them\n"
"   - For recipe names mentioned in the book, cite the page so the user can look it up\n"
"   - If the user has dietary preferences in their profile, filter suggestions accordingly\n"
"   - Offer 2-3 options when possible so the user has choice\n"
"   - Keep it inspiring — 'Try the Chunky Monkey oats from page 45!' not 'Consider a carbohydrate-based meal'\n"
```

### D/E4.2 — Meal-specific retrieval boost (optional)

**File:** `app/services/rag.py` — when the user asks about meals/food, increase `k` (number of retrieved chunks) to surface more recipe options:

```python
# Detect meal-related queries
meal_keywords = ["meal", "recipe", "eat", "food", "snack", "breakfast", "lunch", "dinner",
                 "maaltijd", "recept", "eten", "ontbijt", "lunch", "avondeten"]
is_meal_query = any(kw in user_input.lower() for kw in meal_keywords)

# Use more chunks for meal queries to find multiple options
retrieval_k = 8 if is_meal_query else 5
```

### Testing D/E4

1. Ask: "What can I eat before a morning training?" → should get 2-3 specific meal ideas from the book
2. Ask: "Geef me een snack idee voor na het sporten" → Dutch response with specific food suggestions
3. Ask: "I'm vegetarian, what are good protein sources?" → should respect dietary preference from profile
4. Verify all suggestions are grounded in book content (no fabricated recipes)

---

## D/E5. FAQ Memory

**Theory:** Many users ask the same popular questions ("How much protein do I need?", "What to eat before training?"). Currently each question triggers a full vector search + LLM call. By caching frequent Q&A pairs, we can respond faster, more consistently, and at lower cost.

**Approach:** A `faq_cache` table stores question-answer pairs with hit counts. When a new question is semantically similar to a cached one, return the cached answer (with profile personalization applied on top).

### D/E5.1 — Database: `faq_cache` table

**SQL migration:**
```sql
CREATE TABLE IF NOT EXISTS faq_cache (
  id SERIAL PRIMARY KEY,
  question_hash VARCHAR(64) NOT NULL,       -- SHA-256 of normalized question
  question_text TEXT NOT NULL,               -- original question for readability
  answer_text TEXT NOT NULL,                 -- cached bot response
  language VARCHAR(5) DEFAULT 'nl',          -- nl or en
  hit_count INTEGER DEFAULT 1,              -- how many times this was served
  last_hit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  embedding vector(1536)                    -- for semantic matching (pgvector)
);

CREATE INDEX IF NOT EXISTS idx_faq_hash ON faq_cache(question_hash);
```

**SQLAlchemy model:**
```python
class FAQCache(Base):
    __tablename__ = "faq_cache"

    id = Column(Integer, primary_key=True)
    question_hash = Column(String(64), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    answer_text = Column(Text, nullable=False)
    language = Column(String(5), default="nl")
    hit_count = Column(Integer, default=1)
    last_hit_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # embedding stored via pgvector for semantic search
```

### D/E5.2 — FAQ service

**File:** `app/services/faq_cache.py`

```python
import hashlib
from sqlalchemy.orm import Session
from app.db.models import FAQCache

SIMILARITY_THRESHOLD = 0.92  # cosine similarity — high threshold = exact matches only
MIN_HITS_TO_CACHE = 3        # only cache after question is asked 3+ times

def normalize_question(text: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace."""
    return re.sub(r'\s+', ' ', re.sub(r'[^\w\s]', '', text.lower())).strip()

def get_cached_answer(db: Session, question: str, embedding: list[float]) -> str | None:
    """Check if a semantically similar question exists in cache."""
    # 1. Try exact hash match first (fastest)
    q_hash = hashlib.sha256(normalize_question(question).encode()).hexdigest()
    exact = db.query(FAQCache).filter_by(question_hash=q_hash).first()
    if exact:
        exact.hit_count += 1
        exact.last_hit_at = func.now()
        db.commit()
        return exact.answer_text

    # 2. Semantic similarity search via pgvector
    # (uses cosine distance on the embedding column)
    # Only return if similarity > threshold
    return None  # implement with pgvector cosine similarity query

def maybe_cache_answer(db: Session, question: str, answer: str, language: str, embedding: list[float]):
    """Cache an answer if the question has been asked enough times."""
    q_hash = hashlib.sha256(normalize_question(question).encode()).hexdigest()
    existing = db.query(FAQCache).filter_by(question_hash=q_hash).first()
    if existing:
        existing.hit_count += 1
        existing.last_hit_at = func.now()
        if existing.hit_count >= MIN_HITS_TO_CACHE and not existing.answer_text:
            existing.answer_text = answer
    else:
        db.add(FAQCache(question_hash=q_hash, question_text=question,
                        answer_text=answer, language=language, hit_count=1))
    db.commit()
```

### D/E5.3 — Integration in RAG pipeline

**File:** `app/services/rag.py` — add early check before full retrieval:

```python
# In get_rag_response(), before vector search:
cached = get_cached_answer(db, user_input, query_embedding)
if cached and not has_profile_specific_question(user_input):
    # Use cached answer (skip expensive retrieval + LLM call)
    # Still log to ChatLog for analytics
    return cached
```

### D/E5.4 — Admin dashboard: FAQ management page

**File:** `src/pages/FAQPage.tsx` — new page showing:
- Top cached questions by hit count
- Ability to edit/delete cached answers
- Cache hit rate stats

### Testing D/E5

1. Run the SQL migration on Neon
2. Ask the same question 3+ times from different conversations: "How much protein do I need?"
3. Check `faq_cache` table: `SELECT question_text, hit_count FROM faq_cache ORDER BY hit_count DESC;`
4. On the 4th ask, verify the response is faster (check response time in logs)
5. Edit a cached answer in the dashboard → verify next response uses the updated text

---

## D/E6. Improved Citation Referencing

**Theory:** Users trust the bot more when they can verify answers in the book. Currently citations only appear when explicitly asked. Better citation formatting builds credibility and helps users find the relevant sections.

**Approach:** Update the system prompt to include page references more naturally, and improve the citation format.

### D/E6.1 — Always-on soft citations

**File:** `app/services/rag.py` — replace rule 10:

```python
# BEFORE (current):
# "10. REFERENCES. When the user asks for a reference..."

# AFTER:
"10. **REFERENCES.** Always include a brief source reference at the end of your answer. "
"Format: '📖 Bron: pagina X' (Dutch) or '📖 Source: page X' (English). "
"List the 1-3 most relevant page numbers from the excerpts you used. "
"Keep it short — just the page numbers, no full citations. "
"Example: '📖 Bron: pagina 45, 78'\n"
"If the user specifically asks for detailed references, include the section/chapter name too.\n"
```

### D/E6.2 — Chunk metadata enrichment (optional)

**Theory:** The current vector store chunks may not have clean page numbers. If page metadata is inconsistent, citations will be unreliable.

**Verification step:**
```sql
-- Check what metadata your chunks have:
SELECT cmetadata->>'page' as page, COUNT(*)
FROM langchain_pg_embedding
GROUP BY cmetadata->>'page'
ORDER BY COUNT(*) DESC
LIMIT 20;
```

If page numbers are missing or messy, consider re-ingesting the book with cleaner chunk metadata.

### Testing D/E6

1. Ask: "What are good sources of protein for athletes?" → response should end with "📖 Source: page X, Y"
2. Ask in Dutch: "Hoeveel eiwit heb ik nodig?" → should end with "📖 Bron: pagina X"
3. Ask: "Where can I find more about recovery nutrition? Give me the exact page." → should include section/chapter name
4. Verify cited pages actually match the book content

---

## D/E7. Final Launch Polish

**Theory:** Before going live with paying customers, the system needs thorough testing, bug fixes, and production hardening. This is not a feature stage — it's a quality gate.

### D/E7.1 — End-to-end conversation testing

**Test matrix (run all manually via WhatsApp):**

| Test case | Expected behavior |
|-----------|------------------|
| New user, first message greeting | Welcome message + trial info |
| New user, first message is a question | Welcome intro + answer |
| Profile collection: "I'm 25, 80kg, I do swimming" | Answer + profile saved in DB |
| Personalized question: "How much protein for me?" | Uses stored profile data |
| Meal suggestion: "What should I eat before training?" | 2-3 specific book-based suggestions |
| FAQ hit: ask a popular question | Consistent, fast response |
| Off-topic: "What's the weather?" | Polite refusal in correct language |
| Expired subscription: user with past end date | Expiry message, not a normal answer |
| Blocked user message | Blocked message response |
| Dutch question | Full Dutch response with Dutch citation |
| English question | Full English response with English citation |
| Very long message (500+ chars) | Handled gracefully, no timeout |
| Rapid fire: 5 messages in 10 seconds | All processed, no duplicates |

### D/E7.2 — Dashboard verification checklist

| Page | Check |
|------|-------|
| Dashboard | Stats load, cards clickable, charts render |
| Users | List loads, detail sheet works, plan edit works |
| Usage & Cost | Token counts display, daily chart renders |
| Refusals | Refused messages list with pagination |
| Audit Log | Events display with readable details, pagination works |
| Alerts | Alerts expand, acknowledge/resolve/reopen works |
| Support Accounts | Create account, login with it, verify restricted access |
| Change Password | Change password, logout, login with new password |
| Login | Eye icon toggles password visibility |

### D/E7.3 — Performance and reliability

```sql
-- Check average response time (from chat logs):
SELECT
  DATE(created_at) as day,
  COUNT(*) as messages,
  AVG(completion_tokens) as avg_tokens,
  AVG(cost_usd) as avg_cost
FROM chat_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY day;

-- Check for any orphaned profiles (profile without subscription):
SELECT up.whatsapp_number
FROM user_profiles up
LEFT JOIN subscriptions s ON up.whatsapp_number = s.whatsapp_number
WHERE s.id IS NULL;

-- Check FAQ cache efficiency:
SELECT
  COUNT(*) as cached_questions,
  SUM(hit_count) as total_cache_hits,
  AVG(hit_count) as avg_hits_per_question
FROM faq_cache;
```

### D/E7.4 — Production hardening

- **Rate limiting:** Verify the bot handles bursts without crashing
- **Error handling:** All endpoints return proper error responses (no bare 500s)
- **CORS:** All Vercel preview URLs accepted via regex
- **Logging:** Confirm Render logs capture errors with tracebacks
- **Scheduler:** Verify alert checks run every 30 minutes without failure
- **Database:** Check for missing indexes, slow queries
- **Cost monitoring:** Verify daily cost tracking is accurate
- **Backup:** Confirm Neon has point-in-time recovery enabled

### D/E7.5 — Deployment checks

```bash
# Backend health check:
curl https://whatsapp-chatbot-1-adqn.onrender.com/health
# Expected: {"status": "healthy", "service": "Atleet Buddy AI"}

# Dashboard reachable:
curl -I https://atleet-buddy-hub.vercel.app
# Expected: HTTP 200

# WhatsApp webhook active:
# Send a test message via WhatsApp → verify response within 10 seconds
```

### D/E7.6 — Handover documentation

Prepare for the client:
- Admin login credentials
- How to create support accounts
- How to read alerts and what each alert type means
- How to edit user plans and subscription dates
- How to interpret the refusals page
- Common troubleshooting steps (e.g. user not getting responses → check subscription status)

---

## Implementation Order

| Step | Task | Depends on | Estimated effort |
|------|------|-----------|-----------------|
| 1 | D/E1.1 — user_profiles table + model | — | 30 min |
| 2 | D/E1.2 — Profile extraction service | Step 1 | 2-3 hours |
| 3 | D/E2.1-2.2 — Profile injection + prompt update | Step 1 | 1-2 hours |
| 4 | D/E3.1 — Practical response prompt enhancement | — | 30 min |
| 5 | D/E4.1-4.2 — Meal suggestions prompt + retrieval boost | — | 1 hour |
| 6 | D/E6.1 — Always-on citations | — | 30 min |
| 7 | D/E1.3-1.4 — Admin API + dashboard profile display | Step 1 | 1-2 hours |
| 8 | D/E5.1-5.3 — FAQ cache table + service + integration | — | 3-4 hours |
| 9 | D/E5.4 — FAQ management dashboard page | Step 8 | 2 hours |
| 10 | D/E7 — Full testing, bug fixing, polish | All above | 2-3 days |

**Total estimated effort:** 2-3 weeks (including testing)

**Recommended deploy order:** Steps 1-3 together (profile system), then 4-6 (prompt improvements — low risk, high impact), then 7-9 (dashboard + FAQ), then step 10 last.

---

## Quick Reference: New Database Tables

```sql
-- Run all migrations at once on Neon:

-- 1. User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  whatsapp_number VARCHAR(20) UNIQUE NOT NULL,
  weight_kg FLOAT,
  height_cm FLOAT,
  age INTEGER,
  goals TEXT,
  sport TEXT,
  dietary_preferences TEXT,
  training_frequency TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. FAQ cache
CREATE TABLE IF NOT EXISTS faq_cache (
  id SERIAL PRIMARY KEY,
  question_hash VARCHAR(64) NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  language VARCHAR(5) DEFAULT 'nl',
  hit_count INTEGER DEFAULT 1,
  last_hit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  embedding vector(1536)
);
CREATE INDEX IF NOT EXISTS idx_faq_hash ON faq_cache(question_hash);
```
