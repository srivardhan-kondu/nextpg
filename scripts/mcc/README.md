# MCC allotment → cutoff dataset

Turns MCC's official "Seats Allotment" result PDF into the three CSVs that
`scripts/import-mcc-dataset.ts` loads. Built for the 2025 Round 1 layout
(columns: SNo, Rank, Allotted Quota, Allotted Institute, Course, Alloted
Category, Candidate Category, Remarks). Later rounds use a different layout
(before/after upgrade columns) and need their own parser.

Source PDFs are listed on <https://mcc.nic.in/archive-pg/>.

```bash
# 1. Text with word positions (poppler's pdftotext)
pdftotext -bbox-layout "Final Result of Round 1 for PG Counselling 2025.pdf" r1.layout.html

# 2. One CSV row per allotment; checks every serial number is present and ranks are sorted
python3 scripts/mcc/parse_allotment.py r1.layout.html r1.csv

# 3. Split cells pdftotext fused together, using the known course/quota names
python3 scripts/mcc/repair_fused_rows.py r1.csv r1.repaired.csv

# 4. colleges.csv, branches.csv, cutoffs.csv
python3 scripts/mcc/build_dataset.py r1.repaired.csv data/mcc-2025-r1

# 5. Dry run, then load (see the script header for --retire-seed)
npx tsx scripts/import-mcc-dataset.ts data/mcc-2025-r1
```

## How the numbers are derived

- **Closing rank** = the highest rank allotted to that college × course × quota ×
  seat category in the round. **Opening rank** = the lowest. **Seats** = the
  number of allotments.
- The predictor compares rows by the candidate's own category, so each
  category row combines the seat categories that candidate can take: Open seats
  plus their reserved category (General → Open; OBC → Open + OBC; and so on).
- Quotas: All India and DNB → `AIQ`; paid deemed seats → `DEEMED`; NRI → `NRI`;
  DU, IP University, BHU, AMU → `INSTITUTIONAL`.
- Left out for now: PwD seats and the Jain/Muslim minority quotas, whose
  eligibility the engine does not model yet.
- The same institute sometimes appears under two spellings (e.g. its MD/MS
  seats and its DNB seats); entries with the same name, state and PIN code are
  merged. Different hospitals with the same name are told apart by city, state
  or PIN code.
