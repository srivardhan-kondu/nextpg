# Cutoff data

**Prediction accuracy is a function of what is in this table and nothing else.**

The engine maps a score to a rank range, then matches that range against
`historical_cutoffs`. It never invents a cutoff: with no matching row, a college
simply does not appear, and the stated confidence drops. So the quality of every
prediction, every branch recommendation and every dream validation is bounded by
the coverage and correctness of the rows you load here.

## Current state

Run this against your database to see where you stand:

```sql
SELECT
  COUNT(*) FILTER (WHERE source LIKE 'Seed (representative)%') AS synthetic,
  COUNT(*) FILTER (WHERE source NOT LIKE 'Seed (representative)%') AS real,
  COUNT(*) AS total
FROM historical_cutoffs;
```

A fresh install is **100% synthetic**. Those rows exist so the app is explorable
on day one — they are realistically *shaped* but they are generated, not
published. Shipping them to real users as predictions is the worst failure this
product can have.

## Where the real data comes from

| Quota | Source | Notes |
|---|---|---|
| AIQ (50% of government PG seats) | [mcc.nic.in](https://mcc.nic.in) → PG Medical → Counselling result | Published per round; round 1 and 2 matter most |
| Deemed / Central universities | Same MCC portal, separate result files | Different quota column |
| State quota (the other 50%) | Each state's own authority | e.g. KNRUHS (Telangana), MCC-equivalent per state |

Results are usually PDFs. Extract to CSV with `tabula`, `camelot`, or manual
cleanup. Budget real time for this — it is the least glamorous and most valuable
work in the product.

## Loading it

Import colleges first; cutoffs are matched to them **by name** and unmatched
names are reported and skipped rather than auto-created, so a typo surfaces as an
error instead of silently fragmenting the dataset into duplicate colleges.

```bash
# Small files (< 5 MB) — the admin UI at /admin/import also works
npm run import:cutoffs -- ./data/mcc-2024-round-1.csv
```

Templates with the exact expected headers are in `templates/`.

## Column reference

**colleges**: `name`, `state`, `type` (GOVERNMENT | PRIVATE | DEEMED | DNB),
`city`, `short_name`, `university`

**cutoffs**: `college_name`, `branch_name`, `quota` (AIQ | STATE | DEEMED |
MANAGEMENT | NRI | INSTITUTIONAL), `category` (GENERAL | EWS | OBC | SC | ST),
`sub_category` (NONE | PWD | ARMED_FORCES | NRI | MANAGEMENT | MINORITY),
`closing_rank`, `opening_rank`, `seat_count`, `round`, `academic_year`, `source`

`source` is free text but worth filling honestly (`"MCC 2024 R2"`) — it is how
you tell real rows from seeded ones later.

## Removing the seeded rows

Once you have real coverage:

```sql
DELETE FROM historical_cutoffs WHERE source LIKE 'Seed (representative)%';
```

Reports already generated are unaffected: each prediction snapshots its own
result payload, so a paid report never changes under the user.

## How much is enough

The confidence score is penalised below ~1,500 rows per category. For a
launchable product covering AIQ plus two or three states, expect to need
**several thousand rows per category per year**. Two years of history lets the
`historical` provider model year-over-year drift instead of assuming last year
repeats.
