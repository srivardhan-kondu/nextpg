# Architecture

## Layers

Data flows in one direction. Each layer may call the one below it and never the one above.

```
app/  (routes)          Server Components fetch; Client Components handle interaction
  │
  ├── actions/          Server Actions — auth check → validate → rate limit → delegate → audit
  ├── app/api/          Route Handlers — webhooks, file streaming, JSON for client fetch
  │
  ▼
services/               Business logic. Owns transactions, money, and the prediction engine
  │
  ▼
repositories/           Reusable and paginated queries; the seam services are tested against
  │
  ▼
prisma/                 Schema + migrations
```

Cross-cutting: `lib/` (env, security, utils), `validators/` (Zod), `types/` (contracts), `components/` + `features/` (UI), `pdf/` (report renderer).

**Why repositories exist**: the prediction engine is the product, and it must be testable without a database. `tests/integration/prediction-engine.test.ts` mocks a single repository module and exercises the entire engine with zero I/O.

The layer is applied where it earns its keep rather than universally:

- **Repositories own** reusable, paginated and filtered reads — college search, cutoff lookups, user and payment listings, analytics aggregates. Crucially, `cutoffRepository` is the seam the engine is mocked at.
- **Services own transactions.** `credit.service.ts` calls `prisma.$transaction` directly, because a repository that hands back a transaction client is a worse abstraction than no repository at all.
- **Actions and Server Components** read `prisma` inline for single-use, page-specific queries — idiomatic in the App Router, and it avoids repository methods with exactly one caller.

The line to hold: anything the prediction engine depends on goes through a repository, so the engine stays testable without a database.

---

## The prediction engine

`services/prediction/` implements a provider interface so the engine can be replaced without touching anything else:

```ts
interface PredictionProvider {
  readonly id: string;
  readonly version: string;
  predict(input: PredictionInput): Promise<PredictionResult>;
}
```

Three providers are registered. `PREDICTION_PROVIDER` selects one; an unknown value falls back to `rule-based` rather than throwing, because a typo in an env var must not take down predictions.

| Provider | Status | Intent |
|---|---|---|
| `rule-based` | **Shipping** | Score → rank curve, then match against stored cutoffs |
| `historical` | Scaffold, delegates | Fit multi-year per-seat trends and project the current year |
| `ml` | Scaffold, delegates | POST a feature vector to a hosted model returning a rank distribution |

Both scaffolds delegate to the rule-based engine and append a note saying so, so flipping the env var is always safe.

### How a rank becomes a report

1. **Score → rank.** `scoring.ts` interpolates a published score-vs-rank curve in **log space**, because rank grows geometrically as score falls. Anchors live in one array so they can be re-fitted each year without touching the engine.
2. **Point → range.** `rankBand()` widens the estimate proportionally (higher ranks are far less certain in absolute terms) with a floor, so top ranks do not collapse into false precision.
3. **Quota eligibility.** `quota.service.ts` decides which quotas the candidate can compete in, from `quota_rules` layered on a national baseline. The engine works on an empty rules table.
4. **Opportunity match.** Every cutoff row that closed at or below ~2.2× the worst-case rank. Nothing is shown that is not backed by a `historical_cutoffs` row.
5. **Banding.** A seat that closed well *after* your worst case is `STRONG`; before your best case is `STRETCH`.
6. **Confidence.** Starts at 88 and is *only ever penalised* — thin cutoff coverage, implausible attempt counts, sparse anchor regions. Clamped to `[35, 92]`. **It can never reach 100**, because the product promises an estimate.

### The honesty invariants

These are enforced by tests, not convention:

- Rank is always a **range**, never a point
- Confidence is always `< 100`
- Seat probability is always in `(0, 100)` — exclusive at both ends
- The disclaimer is present in `notes` on every result
- No cutoff data → **empty bands**, never an invented college

---

## The credit system

One credit = one report unlock. Re-reading is free forever.

`prediction_credits` holds the balance; `credit_transactions` is an append-only ledger. Every mutation writes both inside one transaction.

Correctness rests on three mechanisms:

1. **Conditional decrement.** `updateMany({ where: { balance: { gte: cost } } })` — two concurrent unlock requests cannot both pass, because the loser updates zero rows and throws. A read-then-write would let both succeed.
2. **Idempotency keys.** `consume:{predictionId}` and `grant:{paymentId}` are unique columns. A retried request finds the existing row and returns it untouched.
3. **Single transaction.** The balance check, the decrement, the ledger row and the prediction status flip are atomic. A crash mid-flight cannot leave a charged user with a locked report.

### Payment double-credit prevention

Two independent paths can credit an account:

| Path | Trigger | Role |
|---|---|---|
| `verifyPaymentAction` | Browser checkout callback | Fast UX — the balance updates immediately |
| `/api/webhooks/razorpay` | Razorpay server-to-server | **Authoritative** — works even if the user closes the tab |

Both call `grantCredits` with `grant:{paymentId}`. Whichever arrives second is a no-op. The webhook additionally records each delivery in `webhook_events` keyed on the Razorpay event id, so a retried delivery short-circuits before any side effect runs.

---

## The paywall

**Redaction happens on the server.** `buildPredictionView()` strips `bands`, `recommendedBranches`, `recommendedColleges` and `strategy` from a `PREVIEW` prediction before the payload is serialised to the client.

The locked data never reaches the browser, so there is nothing to reveal in devtools. Counts survive redaction — they are the teaser.

`tests/integration/paywall.test.ts` asserts that no college name appears anywhere in a serialised locked view.

---

## Reports

Reports render **on demand** rather than being stored as blobs.

The prediction's `resultPayload` is a **snapshot** taken at generation time, so a later cutoff-data update never silently rewrites a report someone already paid for. Re-rendering is therefore deterministic, and we avoid paying for object storage. `Report.storageKey` exists on the model for the day that changes.

Every download is authorised by `userId`, never by report id alone. Responses are `Cache-Control: private, no-store` — a report is personal data.

---

## The counseling assistant

Grounded, not generative-about-facts. The system prompt's central rule:

> If a number is not in the CONTEXT block, you do not know it.

`buildContext()` assembles a compact factual block from stored rows only — the student's profile, seats on record with their real closing ranks, branch reachability, and the strategy already in the report.

Defence layers:

1. **Sanitisation** — `sanitizeForPrompt()` strips role markers (`system:`) and instruction-boundary tags before user text is sent
2. **Prompt hardening** — the system prompt explicitly says to treat instructions inside user text as ordinary text
3. **Paywall** — the assistant reads the full payload, so it requires an unlocked prediction
4. **Rate limiting** — 30 requests/hour/user, because every call costs money

---

## Security

| Concern | Mechanism |
|---|---|
| Authentication | NextAuth v5, JWT sessions (required by the Credentials-based OTP flow) |
| Authorization | `requireUser` / `requireAdmin` guards. Admin role is **re-read from the database** on every admin page — a JWT claim is not authorization |
| Middleware | Coarse fast-reject only. Never the authorization decision |
| Ownership | Every user-scoped query filters by `userId`. A cuid being hard to guess is not access control |
| Input validation | Zod at every boundary — actions, route handlers, CSV imports |
| CSRF | Server Actions carry built-in origin checks. Our own POST handlers call `assertSameOrigin()` |
| Rate limiting | Upstash sliding window, tuned per surface. OTP is tightest |
| Webhook auth | HMAC-SHA256 over the **raw** body, compared in constant time |
| SQL injection | Prisma parameterises everything. The two raw queries use tagged templates with bound parameters |
| XSS | React escapes by default; `sanitizeText` additionally guards PDF, email and LLM outputs, which have no such escaping |
| Secrets | `lib/env.ts` validates at boot — a misconfigured deploy dies immediately, not at the first user request |
| Audit | `audit()` on every privileged action. Deliberately never throws — an audit failure must not break the operation it records |

---

## Database notes

- **Money is `Int` in paise.** Floats do not represent ₹99.00 exactly.
- **`historical_cutoffs.state` is denormalised** from the college so state-quota filtering stays index-only.
- **Composite unique** on `(collegeId, branchId, quota, category, subCategory, round, academicYear)` makes imports idempotent.
- **Soft deletes** for colleges and branches (`isActive`) because cutoff rows reference them and reports snapshot them.
- **`onDelete: Cascade`** from `User` so an account deletion is complete; `SetNull` where history should outlive the referenced row.
