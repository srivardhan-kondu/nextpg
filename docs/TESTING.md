# Testing Strategy

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run typecheck     # tsc --noEmit — the first line of defence
```

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

## Deliberate gaps

Honest about what is not covered:

- **No E2E suite.** Playwright over the login → predict → pay → unlock → download flow is the highest-value addition. Razorpay test mode supports it.
- **Credit concurrency is not tested.** The conditional decrement should be verified against a real Postgres by firing concurrent unlocks and asserting exactly one succeeds. It needs a test database.
- **PDF rendering is not snapshot-tested.** A layout regression would ship silently. Byte comparison is too brittle; asserting section headings appear in extracted text would work.
- **No component tests.** Testing Library and jsdom are installed and configured but unused. Server Components need Next's test environment.

## Adding a test

Put it beside its peers, name it after the behaviour rather than the function, and assert the product promise instead of the implementation:

```ts
// Good — survives a rewrite of the engine
it('never reports full confidence', ...)

// Bad — breaks when a constant is re-tuned
it('returns exactly 88 when coverage is 1', ...)
```
