# Deployment Guide

Target stack: **Vercel** (app) + **Neon PostgreSQL** (database) + **Upstash Redis** (rate limiting) + **Razorpay** (payments).

---

## 1. Database — Neon

1. Create a project at [neon.tech](https://neon.tech). Pick the region closest to your users (`ap-south-1` for India).
2. From the connection details, copy **two** strings:
   - The **pooled** connection (`...-pooler...`) → `DATABASE_URL`
   - The **direct** connection → `DIRECT_URL`

   Serverless functions exhaust direct connections quickly, so runtime queries go through the pooler. Migrations need a direct connection because they take advisory locks the pooler does not pass through.

3. Push the schema and seed reference data:

   ```bash
   npm run db:deploy   # applies migrations
   npm run db:seed     # branches, colleges, quota rules, representative cutoffs
   ```

> The seed writes **representative** cutoffs, not published ones. They exist so the app is explorable on day one. Replace them with real data before launch — see [Loading real cutoff data](#6-loading-real-cutoff-data).

---

## 2. Authentication

```bash
openssl rand -base64 32   # → AUTH_SECRET
```

**Google is the only sign-in method, and it is required.** There is no email/password login and no separate signup — a first Google sign-in creates the account.

Create an OAuth client in Google Cloud Console → APIs & Services → Credentials → OAuth client ID → **Web application**. Set the authorised redirect URI to exactly:

```
https://yourdomain.in/api/auth/callback/google
```

No trailing slash, and the scheme must match. Add `http://localhost:3000/api/auth/callback/google` too if you develop locally — Google permits plain `http` only for localhost.

Authorised JavaScript origins can be left empty: NextAuth uses a server-side flow.

Finally, check the **OAuth consent screen**. While its publishing status is *Testing*, only Google accounts listed under **Test users** can sign in. Publish the app before launch, or your users will be silently rejected.

Without `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` the login page renders an explicit "sign-in is unavailable" notice rather than a dead button — but nobody can get in.

---

## 3. Payments — Razorpay

1. Dashboard → Settings → API Keys → generate. Use **test** keys until you are live.
2. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` (the same value as the key id — it is public by design).
3. Dashboard → Settings → Webhooks → Add:
   - **URL**: `https://yourdomain.in/api/webhooks/razorpay`
   - **Secret**: any strong random string → `RAZORPAY_WEBHOOK_SECRET`
   - **Events**: `payment.captured`, `payment.failed`, `order.paid`

The webhook is the **authoritative** credit path. The browser callback is a UX optimisation — if a user closes the tab mid-redirect, the webhook still credits them. Both share an idempotency key, so a double delivery cannot double-credit.

Test the webhook before launch:

```bash
# From the Razorpay dashboard, use "Send test webhook", then verify:
#   - a webhook_events row exists with processedAt set
#   - the payment row moved to PAID
#   - a credit_transactions row exists with type PURCHASE
```

---

## 4. Rate limiting — Upstash

**Required in production.** Create a Redis database at [upstash.com](https://upstash.com) and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

Without it the limiter silently falls back to an in-process `Map`. On Vercel that means each lambda instance keeps its own counter, so the effective limit is `configured_limit × instance_count` — which is not a limit. Check `/api/health` after deploy: `checks.distributedRateLimit` must be `true`.

---

## 5. Vercel

1. Import the repository. Framework preset: **Next.js** (auto-detected).
2. Build command stays `npm run build` — it runs `prisma generate` first, which is required because Vercel caches `node_modules` and the generated client would otherwise go stale.
3. Add every variable from `.env.example` under Settings → Environment Variables. Set `NEXT_PUBLIC_APP_URL` and `AUTH_URL` to your production origin.
4. Deploy, then create your first admin:

   ```bash
   # Sign in through the UI once so the account exists, then:
   npm run create:admin -- you@yourdomain.in --super
   ```

   The script cannot create an account — only promote an existing one — so it can never mint a login that bypasses auth.

### Function configuration

Two routes declare `maxDuration = 60` because they are slow by nature:

- `/api/reports/[id]/download` — PDF rendering is CPU-bound
- `/api/assistant` — waits on the OpenAI API

On Vercel's Hobby plan the ceiling is 60s; Pro allows more. If report generation times out for users with very large opportunity sets, lower `MAX_AIQ_ROWS` / `MAX_STATE_ROWS` in `services/report/report.service.ts`.

---

## 6. Loading real cutoff data

Cutoff coverage is the single biggest lever on prediction quality — the confidence score is explicitly penalised when coverage is thin.

**Small files (< 5 MB)** — `/admin/import` in the UI. Import colleges first, then cutoffs.

**Large files** — the CLI, which has no request timeout:

```bash
npm run import:cutoffs -- ./data/mcc-2024-round-3.csv
```

Required columns:

```
college_name, branch_name, quota, category, sub_category,
closing_rank, opening_rank, seat_count, round, academic_year, source
```

Colleges and branches are matched **by name and never auto-created**. Unmatched names are reported and skipped, so a typo surfaces as an error instead of silently fragmenting the dataset into duplicate colleges.

---

## 7. Post-deploy verification

```bash
curl https://yourdomain.in/api/health
```

Every check should read `true` (or `"up"` for the database):

```json
{
  "status": "ok",
  "checks": {
    "database": "up",
    "google": true,
    "emailOtp": true,
    "razorpay": true,
    "assistant": true,
    "distributedRateLimit": true
  }
}
```

Then walk the money path end to end with a real (test-mode) card:

1. Sign in → run a prediction → confirm the rank range renders and premium sections are locked
2. Buy credits → confirm the balance increases and a `payments` row is `PAID`
3. Unlock a report → confirm the balance drops by exactly 1
4. Download the PDF → confirm all 11 sections render
5. Re-download → confirm **no** credit is charged
6. Open the same report the next day → confirm it is still free

---

## Rollback

Vercel keeps every deployment. Promote a previous one from the dashboard — that reverts application code instantly.

**Database migrations do not roll back with it.** Write migrations to be backward compatible with the previous release (add columns, never drop them in the same deploy as the code change that stops using them). Neon's branching feature can restore a point-in-time copy if you need to recover data.
