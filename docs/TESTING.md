# Testing Strategy

```bash
npm test              # unit + integration (Vitest)
npm run test:e2e      # end-to-end in a real browser (Playwright)
npm run test:e2e:ui   # the same, with Playwright's UI runner
npm run typecheck     # tsc --noEmit — the first line of defence
```

Two layers, deliberately. Vitest covers logic without I/O and runs in under a
second. Playwright drives a real browser against a real server and a real
database, and is the only layer that catches wiring.

## What is tested, and why

Testing effort is concentrated where a bug is expensive: the prediction engine (the product), the paywall (revenue), and the credit ledger (money).

| Suite | Covers | Why it matters |
|---|---|---|
| `unit/scoring` | Score→rank curve, banding, confidence | Monotonicity and honesty invariants |
| `unit/validators` | Every Zod schema | These are the trust boundary for all input |
| `unit/security` | Sanitisation, HMAC verification | Signature forgery is direct revenue theft |
| `unit/csv` | CSV parser | Feeds the cutoff table — bad parsing corrupts predictions |
| `integration/prediction-engine` | Full engine over mocked repositories | The whole product, without a database |
| `integration/paywall` | Server-side redaction | A leak here gives away the paid product |
| `e2e/public-pages` | Every public page renders | Catches render-time crashes |
| `e2e/auth` | Login screen, guards, sessions | The only door into the product |
| `e2e/admin-access` | Role gates, both directions | Privilege escalation and lockout |
| `e2e/prediction-paywall` | The money path, end to end | Credits, unlock, PDF, ownership |
| `e2e/dream-validator` | Validation behind the paywall | Premium feature gating |
| `e2e/dashboard` | Empty states, history, balances | What a real account actually sees |

## Why the E2E layer exists

Four bugs shipped past a green build, a clean typecheck and 77 passing unit
tests. Every one of them needed a real browser and a real database to see:

| Bug | Why unit tests missed it |
|---|---|
| Admin panel unreachable for admins | The role never reached edge middleware. No unit test runs middleware. |
| Whole authenticated app crashed | A Lucide component was passed across the RSC boundary. It still returned **HTTP 200**, so status-code checks looked green. |
| Credit unlock rolled back | Prisma's 5s transaction timeout, only exceeded against a real pooled database. |
| Step 3 of the wizard was skipped | A `type="submit"` swapped in under the pointer mid-click. Pure DOM/React interaction. |

That last pair is the lesson worth keeping: **HTTP 200 is not proof a page
works**, and logic tests cannot see wiring.

## The invariants worth protecting

These assert product promises, not implementation details. They should survive a rewrite of the engine:

```
Rank is always a range          rankMax > rankMin
Confidence is never certainty   confidence < 100
Probability is never certainty  0 < probability < 100
Better score, better rank       scoreToRank is monotonically decreasing
No data means no claim          empty cutoffs → empty bands, never invented colleges
The disclaimer always ships     PREDICTION_DISCLAIMER present in every result
A locked report leaks nothing   no college name in a serialised PREVIEW view
```

If a change breaks one of these, the change is wrong — not the test.

## How the engine is tested without a database

`repositories/cutoff.repository` is mocked at the module boundary. The engine is pure logic over repository output, so this exercises banding, probability, quota separation, confidence penalties and version stamping with zero I/O — the suite runs in under half a second.

This is the payoff for the repository layer.

## How E2E handles auth and data

**Auth.** Google's consent screen blocks automation, so no suite can drive a
real OAuth round trip. `signInAs` mints the same session cookie NextAuth would
issue, signed with the deployment's own `AUTH_SECRET`. Middleware, the session
callback, the admin role gate and ownership checks all run unmodified against a
genuine token. The parts of the flow this codebase *does* own — the button, the
redirect target, the error states, the graceful degradation when Google is unset
— are asserted in `auth.spec.ts`.

**Data.** Every account the suite creates is prefixed `e2e-`, and
`global-teardown` deletes exactly those rows (cascades handle the rest). That
runs even when tests fail, so a red run leaves nothing behind. It is what makes
running against a shared development database safe.

For CI, point `DATABASE_URL` at a dedicated Neon branch rather than the
development database.

## Deliberate gaps

Honest about what is not covered:

- **PDF layout is not visually tested.** The suite asserts a valid PDF of a sane size downloads; it would not catch text overlapping, which is a bug that already shipped once. Visual snapshot diffing would close this.
- **Credit concurrency is not tested.** The conditional decrement should be verified by firing simultaneous unlocks and asserting exactly one succeeds. Playwright's serial execution cannot express that.
- **Razorpay checkout is never exercised.** Test-mode keys plus Playwright could cover it; today the money path is tested from the credit ledger inward.
- **No component tests.** Testing Library and jsdom are installed but unused. E2E covers the same ground more faithfully, at more cost.

## Adding a test

Put it beside its peers, name it after the behaviour rather than the function, and assert the product promise instead of the implementation:

```ts
// Good — survives a rewrite of the engine
it('never reports full confidence', ...)

// Bad — breaks when a constant is re-tuned
it('returns exactly 88 when coverage is 1', ...)
```
