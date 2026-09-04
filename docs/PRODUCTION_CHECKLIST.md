# Production Checklist

Work top to bottom. Anything marked **blocking** must be true before you take real money.

## Environment

- [ ] **blocking** `AUTH_SECRET` is a fresh 32+ byte random value, not the one from any example
- [ ] **blocking** `DATABASE_URL` uses Neon's **pooled** endpoint; `DIRECT_URL` uses the direct one
- [ ] **blocking** `NEXT_PUBLIC_APP_URL` and `AUTH_URL` are the production origin, with `https://`
- [ ] **blocking** `SKIP_ENV_VALIDATION` is unset in the runtime environment
- [ ] At least one auth provider is configured (Google OAuth or SMTP for OTP)
- [ ] `/api/health` returns `status: "ok"` with every check passing

## Rate limiting

- [ ] **blocking** Upstash Redis is configured — `checks.distributedRateLimit` is `true` in `/api/health`

  Without it the limiter is per-lambda, so the real limit is `configured × instance_count`. The OTP endpoint becomes a free email-spam relay.

- [ ] Limits in `lib/security/rate-limit.ts` reviewed against expected traffic

## Payments

- [ ] **blocking** Razorpay switched from test keys to **live** keys
- [ ] **blocking** Webhook registered at `/api/webhooks/razorpay` with `payment.captured`, `payment.failed`, `order.paid`
- [ ] **blocking** `RAZORPAY_WEBHOOK_SECRET` matches the dashboard exactly
- [ ] Test webhook delivered successfully — a `webhook_events` row exists with `processedAt` set
- [ ] Full purchase completed with a real card in live mode, then refunded
- [ ] Verified a **duplicate** webhook delivery does not double-credit (re-send the same event from the dashboard; the balance must not move)

## Data

- [ ] **blocking** Seeded representative cutoffs replaced with published data

  Seeded rows are marked `source: "Seed (representative) …"`:

  ```sql
  SELECT COUNT(*) FROM historical_cutoffs WHERE source LIKE 'Seed (representative)%';
  ```

  This must be `0` in production. Shipping synthetic cutoffs as real predictions is the single worst failure mode this product has.

- [ ] Cutoff coverage is adequate for the categories you serve — check `/admin` → Data coverage
- [ ] Quota rules reviewed for every state you actively market in
- [ ] `LATEST_CUTOFF_YEAR` and `EXAM_YEAR` in `config/site.ts` match the current cycle

## Access control

- [ ] **blocking** At least one `SUPER_ADMIN` exists (`npm run create:admin -- you@domain --super`)
- [ ] No unintended `ADMIN` accounts: `SELECT email, role FROM users WHERE role != 'USER';`
- [ ] Verified a normal user gets redirected away from `/admin`
- [ ] Verified user A cannot open user B's report by id (expect 404, not 403 — do not confirm existence)

## Correctness — walk the money path

- [ ] Prediction shows a **range**, never a single rank
- [ ] Confidence renders and is below 100
- [ ] Disclaimer appears on every surface showing a rank
- [ ] A locked prediction's HTML source contains **no** college names (View Source, search for one)
- [ ] Unlock deducts exactly 1 credit
- [ ] PDF downloads with all 11 sections
- [ ] Re-download charges **nothing**
- [ ] An old report opens free the next day
- [ ] Dream Validator refuses to run against a locked prediction
- [ ] With zero credits, the unlock button routes to `/credits`

## Frontend

- [ ] Dark and light mode both render correctly on every page
- [ ] Mobile (360px) — no horizontal scroll anywhere
- [ ] Keyboard-only navigation reaches every interactive control with a visible focus ring
- [ ] Forms announce errors to screen readers (`role="alert"`)
- [ ] Loading skeletons appear on slow navigations
- [ ] Empty states render for a brand-new account

## Legal and trust

- [ ] **blocking** `/terms` and `/privacy` pages exist — they are linked from the login screen
- [ ] Refund policy published (Razorpay requires one)
- [ ] Support email in `config/site.ts` is monitored
- [ ] Disclaimer states clearly that you are not affiliated with NBEMS, MCC, or any state authority

## Operations

- [ ] Error monitoring wired up (Sentry or equivalent) — `console.error` alone is not monitoring
- [ ] Uptime check polling `/api/health`
- [ ] Neon backups / point-in-time restore confirmed working
- [ ] Verified a rollback: promote a previous Vercel deployment and confirm the app still works
- [ ] Someone other than you can deploy and knows where the secrets live

## Load

Before a results-day traffic spike:

- [ ] Neon compute sized above the free tier — connection limits are the first thing to break
- [ ] Confirmed the pooled connection string is what production actually uses
- [ ] PDF generation timing measured; if it approaches 60s, reduce the row caps in `report.service.ts`
- [ ] Consider queueing report generation if concurrent unlocks exceed your function concurrency

---

## Known limitations

State these plainly rather than discovering them under load.

1. **Predictions are only as good as the cutoff data.** The engine is honest about this — confidence drops when coverage is thin — but thin data still means weak predictions.
2. **The score→rank curve is fitted to past years.** A drastically harder or easier paper shifts the whole distribution. Re-fit `SCORE_RANK_ANCHORS` when official data lands.
3. **Reports render synchronously.** A large opportunity set on a cold lambda can approach the timeout. Row caps mitigate this; a queue would solve it.
4. **`historical` and `ml` providers are scaffolds.** They delegate to the rule-based engine and say so in the result notes.
5. **Assistant answers are not audited for accuracy.** Grounding and prompt hardening reduce fabrication; they do not eliminate it. The disclaimer matters.
