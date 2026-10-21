"""Repair rows where pdftotext fused a course or quota into the institute text,
using the vocabulary of course / quota values seen in cleanly-parsed rows."""
import csv, sys, re
from collections import Counter
src, out = sys.argv[1], sys.argv[2]
rows = list(csv.DictReader(open(src)))
QUOTAS = ['Self-Financed Merit Seat/(Paid Seat Quota)', 'Aligarh Muslim University', 'Banaras Hindu University',
          'Delhi University Quota', 'Muslim Minority Quota', 'Jain Minority Quota', 'IP University Quota',
          'Non-Resident Indian', 'Armed Forces Medical', 'DNB Quota', 'All India']
ok = lambda r: r['quota'] in QUOTAS and r['institute'] and r['course'] and r['allotted_category']
courses = Counter(r['course'] for r in rows if ok(r))
vocab = sorted([c for c, n in courses.items() if n >= 2], key=len, reverse=True)

fixed = 0
for r in rows:
    if ok(r): continue
    before = dict(r)
    # quota: find a known quota phrase at the start of quota+institute
    if r['quota'] not in QUOTAS:
        joined = (r['quota'] + ' ' + r['institute']).strip()
        for q in QUOTAS:
            if joined.startswith(q):
                r['quota'] = q; r['institute'] = joined[len(q):].strip(); break
            if q in joined:  # quota words interleaved with institute words
                r['quota'] = q; r['institute'] = re.sub(r'\s+', ' ', joined.replace(q, ' ')).strip(); break
    # course: find the longest known course string inside the institute text
    if not r['course']:
        for c in vocab:
            if c in r['institute']:
                r['course'] = c; r['institute'] = re.sub(r'\s+', ' ', r['institute'].replace(c, ' ', 1)).strip(); break
    if ok(r): fixed += 1

still = [r for r in rows if not ok(r)]
print('repaired', fixed, '| still incomplete', len(still))
for r in still[:10]: print('  ', {k: r[k] for k in ('sno', 'rank', 'quota', 'institute', 'course')})
with open(out, 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
print('distinct institutes', len({r['institute'] for r in rows}), '| distinct courses', len({r['course'] for r in rows}))
