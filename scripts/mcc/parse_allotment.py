"""Parse MCC 2025 Round 1 'Seats Allotment' (pdftotext -bbox-layout) into CSV.
Each text line belongs to one table column; lines are assigned to the column whose
centre is nearest, and grouped into rows by the SNo that starts each row."""
import sys, re, csv, html
from collections import Counter
src, out = sys.argv[1], sys.argv[2]
LINE = re.compile(r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</line>', re.S)
WORD = re.compile(r'<word xMin="([\d.]+)" yMin="[\d.]+" xMax="([\d.]+)" yMax="[\d.]+">([^<]*)</word>')
COLS = ['sno', 'rank', 'quota', 'institute', 'course', 'allotted_category', 'candidate_category', 'remarks']
CENTRES = [22.5, 67.4, 134.7, 359.0, 595.0, 672.0, 722.0, 795.0]
GAP = 9.0
CATS = {'General', 'OBC', 'SC', 'ST', 'EWS', 'PwD', 'Open'}

def nearest(xc):
    return min(range(len(CENTRES)), key=lambda i: abs(CENTRES[i] - xc))

def clean(parts):
    s = ' '.join(parts)
    s = re.sub(r'-\s+(?=[A-Za-z])', '-', s)
    return html.unescape(re.sub(r'\s+', ' ', s)).strip()

rows = []
text = open(src, encoding='utf-8', errors='ignore').read()
for page_no, page in enumerate(re.split(r'<page ', text)[1:], start=1):
    lines = []
    for x0, y0, x1, y1, body in LINE.findall(page):
        words = [(float(a), float(b), w) for a, b, w in WORD.findall(body)]
        if not words: continue
        lines.append((float(x0), float(y0), float(x1), words))
    hdr = [l for l in lines if l[3][0][2] == 'SNo']
    if hdr: lines = [l for l in lines if l[1] > hdr[0][1] + 16]
    foot = [l[1] for l in lines if any(w[2] == 'Page' for w in l[3]) and any(w[2] == 'No.' for w in l[3])]
    if foot: lines = [l for l in lines if l[1] < min(foot) - 1]
    starts = sorted({round(l[1], 1) for l in lines if nearest((l[0] + l[2]) / 2) == 0 and re.fullmatch(r'\d+', ' '.join(w[2] for w in l[3]))})
    for i, ys in enumerate(starts):
        ye = starts[i + 1] if i + 1 < len(starts) else 1e9
        cells = [[] for _ in COLS]
        for x0, y0, x1, words in sorted(lines, key=lambda l: (l[1], l[0])):
            if not (ys - 2 <= y0 < ye - 2): continue
            # pdftotext sometimes fuses text from neighbouring columns into one
            # line. Cells are separated by a wide gap, words within a cell by a
            # narrow one: split at wide gaps, then place each piece by its centre.
            ws = sorted(words)
            seg = [ws[0]]
            for prev, cur in zip(ws, ws[1:]):
                if cur[0] - prev[1] > GAP:
                    cells[nearest((seg[0][0] + seg[-1][1]) / 2)].extend(w for _, _, w in seg)
                    seg = []
                seg.append(cur)
            cells[nearest((seg[0][0] + seg[-1][1]) / 2)].extend(w for _, _, w in seg)
        for ci in (0, 1):  # only digits belong to SNo / Rank
            spill = [t for t in cells[ci] if not t.isdigit()]
            if spill:
                cells[ci] = [t for t in cells[ci] if t.isdigit()]; cells[2] = spill + cells[2]
        spill = [t for t in cells[6] if t not in CATS]
        if spill:
            cells[6] = [t for t in cells[6] if t in CATS]; cells[7] = spill + cells[7]
        rec = {c: clean(v) for c, v in zip(COLS, cells)}
        rec['page'] = page_no
        rows.append(rec)

with open(out, 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=COLS + ['page']); w.writeheader(); w.writerows(rows)

snos = [int(r['sno']) for r in rows if r['sno'].isdigit()]
print('rows', len(rows), '| max sno', max(snos), '| missing', len(set(range(1, max(snos) + 1)) - set(snos)), '| dup', len(snos) - len(set(snos)))
ranks = [int(r['rank']) for r in rows if r['rank'].isdigit()]
print('ranks sorted:', all(a <= b for a, b in zip(ranks, ranks[1:])))
bad = [r for r in rows if not (r['sno'].isdigit() and r['rank'].isdigit() and r['quota'] and r['institute'] and r['course'] and r['allotted_category'])]
print('incomplete', len(bad)); [print('  ', b) for b in bad[:3]]
print('distinct institutes', len({r['institute'] for r in rows}), '| distinct courses', len({r['course'] for r in rows}))
for c in ['quota', 'allotted_category', 'candidate_category', 'remarks']:
    print(c, Counter(r[c] for r in rows).most_common(12))
