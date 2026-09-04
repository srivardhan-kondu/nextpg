# NextPG

**Predict Your Rank. Validate Your Dream. Plan Your PG Journey.**

A production-grade SaaS application for Indian PG medical aspirants. Estimates NEET PG rank from expected score, matches that estimate against historical closing ranks to surface realistic colleges and branches, validates dream branches and colleges, and generates a professional PDF report.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # fill in DATABASE_URL and AUTH_SECRET at minimum
npm run db:push                # create the schema
npm run db:seed                # branches, colleges, quota rules, representative cutoffs
npm run dev
```

Open [localhost:3000](http://localhost:3000).

**Sign-in requires Google OAuth.** It is the only method — there is no
email/password login and no separate signup, since a first Google sign-in
creates the account. Create a Web application OAuth client in Google Cloud
Console with the redirect URI `http://localhost:3000/api/auth/callback/google`,
then set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Without them the login
page says so rather than offering a dead button.

To reach the admin panel, sign in once, then:

```bash
npm run create:admin -- you@example.com --super
```

> The seed writes **representative** cutoffs so the app is explorable immediately. They are marked `source: "Seed (representative) …"` and must be replaced with published data before launch. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Stack

Next.js 15 (App Router) · TypeScript · TailwindCSS · ShadCN UI · React Hook Form · Zod · Prisma · Neon PostgreSQL · NextAuth v5 · Razorpay · @react-pdf/renderer · Upstash · Vercel

---

## How it works

Two tabs, one credit system.

**Rank & College Predictor** — a three-step wizard collects your profile, exam performance and college preference. The engine maps your score to a rank *range* (never a point), then matches it against `historical_cutoffs` to produce banded opportunities: strong, moderate, stretch.

**Dream Validator** — checks a specific branch and college against your estimated rank, reporting a probability, a likelihood band, the required rank range, eligible quotas and available branches.

**Credits** — ₹99 buys 5 credits. One credit unlocks one report, permanently. Re-opening or re-downloading is always free. No subscription.

Running a prediction is **free**: you see your rank range, confidence and opportunity counts before paying. A credit unlocks the detailed analysis, the validators and the PDF.

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit + integration (Vitest) |
| `npm run test:e2e` | End-to-end in a real browser (Playwright) |
| `npm run db:push` | Push schema without a migration (development) |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed reference data |
| `npm run db:studio` | Prisma Studio |
| `npm run create:admin -- <email> [--super]` | Promote a user to admin |
| `npm run import:cutoffs -- <file.csv>` | Bulk cutoff import (no request timeout) |

---

## Project layout

```
app/              Routes — (marketing) (auth) (app) (admin) + api/
actions/          Server Actions: auth → validate → rate limit → delegate → audit
services/         Business logic: prediction engine, credits, payments, reports, assistant
repositories/     Every Prisma query lives here
validators/       Zod schemas — the trust boundary for all input
features/         Feature-scoped UI components
components/       Shared UI (ui/ is the ShadCN layer)
lib/              env, security, utils, constants
pdf/              @react-pdf report document
prisma/           Schema, migrations, seed
tests/            Vitest — unit and integration
scripts/          Operational CLI
docs/             Architecture, deployment, testing, production checklist
```

---

## What this product promises — and what it does not

The engine is built around a single constraint: **it must never imply certainty it does not have.** These are enforced by tests, not convention.

- Rank is always a **range**, never a single number
- Confidence is always below 100
- Seat probability is strictly between 0 and 100
- Every college shown is backed by a real `historical_cutoffs` row — **nothing is invented**
- No data means empty results and an honest message, never a plausible-looking guess
- The disclaimer ships with every prediction

The counseling assistant inherits this: if a number is not in its grounded context block, it says it does not know.

---

## Documentation

| Document | Read it when |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Understanding the layers, the engine, or the credit system |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploying to Vercel, Neon, Razorpay, Upstash |
| [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md) | Before taking real money |
| [docs/TESTING.md](docs/TESTING.md) | Writing or extending tests |

---

## Configuration

Every integration is optional and degrades gracefully — the UI hides what is not configured:

| Unset | Effect |
|---|---|
| `GOOGLE_CLIENT_*` | **Nobody can sign in** — the login page explains why |
| `RAZORPAY_*` | Checkout replaced with a configuration notice |
| `OPENAI_API_KEY` | Counseling assistant panel hidden |
| `UPSTASH_REDIS_*` | Rate limiting falls back to in-process — **not production-safe** |

`GET /api/health` reports which are live.
