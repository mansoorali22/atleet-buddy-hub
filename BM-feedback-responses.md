# Responses to BM Feedback — Atleet Buddy Dashboard

---

## B1. User Management Dashboard

**Q: What's the definition of active? When does a user become inactive?**

A user is considered **active** when they have a valid, non-expired subscription. A user becomes **inactive** when their subscription expires (the end date passes). There is no time-based inactivity rule (e.g. "no messages in 30 days") — it's purely subscription-driven.

**Q: Is there a rule for auto-blocking, or is it manual only?**

There is **no auto-blocking**. When a subscription expires, the bot will automatically refuse to answer with a message like *"Your subscription has expired, please renew to continue using the service."* The user is NOT blocked — they can be reactivated easily by updating their plan or extending their subscription dates. Blocking is always a manual admin decision.

**Q: What's the definition of end date? Does plan type 'Trial' have an end date?**

The **end date** is the date when the subscription period expires. Yes, **Trial plans do have an end date** — it's typically set when the trial is created (e.g. 7 or 14 days from signup). When the trial end date passes and no paid plan is activated, the user gets the auto-refuse expiry message.

**Q: Column 4 "Type" — can it be deleted?**

Yes, **done** — the "Type" column has been removed. The plan name already contains enough information to distinguish between prepaid credits and subscription plans.

**How to test the expired access handling:**

1. Pick a test user in the Users page
2. Set their subscription end date to a date in the past (e.g. yesterday)
3. Send a message from that user's WhatsApp number
4. The bot should respond with the expiry/renewal message instead of answering normally
5. To reactivate: update their end date to a future date or change their plan

---

## B2. Role-Based Access

**Q: Permission separation — this feature is missing, I can't find it.**

The permission separation is now **implemented and visible** in the sidebar. When logged in as a **support** account:

- **Can access:** Dashboard, Users (plan changes only), Usage & Cost, Refusals, Alerts, Change Password
- **Cannot access:** Audit Log, Support Accounts management
- **Cannot do on Users page:** change status, change subscription dates, block/unblock users — these actions are hidden for support users

To test: create a support account via the "Support Accounts" page (admin only), then log in with those credentials. You'll see a reduced sidebar and restricted actions.

---

## B4. Refusal Analytics

**Q: Group "not covered" questions by topic — when finishing the bot we should take a look at this.**

Agreed — the Refusal Analytics page now shows **the actual refused messages** (what the user asked and how the bot refused), not just category counts. This makes it easy to review what users are asking that the bot can't answer.

When finalizing the bot content, this page will be valuable for:
- Identifying common questions that aren't covered in the knowledge base
- Spotting patterns where the bot refuses unnecessarily
- Building out FAQ content to reduce the refusal rate

---

## B5. Audit Log

**Q: Works OK for now.**

Noted — no changes needed. The audit log tracks all admin actions with readable descriptions (e.g. "Plan changed from Trial to 50 credits") and includes CSV export for reporting.

---

## B6. Alerts

**Q: It gives 1 alert but can't hit the info button or open the ticket. Can't undo an action (set back to acknowledged/resolved).**

**Fixed.** The alerts page now has:

1. **Expandable details** — click any alert card to expand it and see the full details (threshold values, actual values, etc.)
2. **Reopen action** — after acknowledging or resolving an alert, a "Reopen" button appears to set it back to active
3. **Full action flow:** Active → Acknowledge → Resolve, and Reopen at any step to go back to Active
