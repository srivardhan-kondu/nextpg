"""Turn parsed MCC 2025 Round 1 allotments into colleges / branches / cutoffs CSVs.

Closing rank = the highest (worst) rank allotted to a seat in Round 1. The
predictor compares rows by the candidate's own category, so each category row
combines the seat categories that candidate can take: Open plus their own.
PwD seats and minority quotas are left out for now (eligibility not modelled)."""
import csv, sys, re, json
from collections import Counter, defaultdict

SRC, OUT = sys.argv[1], sys.argv[2]
YEAR, ROUND, SOURCE = 2025, 1, 'MCC 2025 R1'
rows = list(csv.DictReader(open(SRC)))

# ---- rejoin courses split across cells (fixed patterns seen in this file) ----
REJOIN = [
    ('(NBEMS) Cardio Vascular', 'and Thoracic Surgery (Direct 6 Years Course)', '(NBEMS) Cardio Vascular and Thoracic Surgery (Direct 6 Years Course)'),
    ('(NBEMS) Neuro Surgery', '(Direct 6 Years Course)', '(NBEMS) Neuro Surgery (Direct 6 Years Course)'),
    ('M.D. (PREVENTIVE and', 'SOCIAL MEDICINE)/ COMMUNITY MEDICINE', 'M.D. (PREVENTIVE and SOCIAL MEDICINE)/ COMMUNITY MEDICINE'),
    ('M.D. (DERM.,VENE. and', 'LEPROSY)/ (DERMATOLOGY)/(SKIN and VENEREAL DISEASES)/(VENEREOL OGY)', 'M.D. (DERM.,VENE. and LEPROSY)/ (DERMATOLOGY)/(SKIN and VENEREAL DISEASES)/(VENEREOL OGY)'),
    ('DIP.IN MEDICAL RADIO-', 'DIAGNOSIS', 'DIP.IN MEDICAL RADIO-DIAGNOSIS'),
    ('DIP.IN MEDICAL', 'DIAGNOSIS', 'DIP.IN MEDICAL RADIO-DIAGNOSIS'),
    ('(NBEMS) Obstetrics and', 'Gynaecology', '(NBEMS) Obstetrics and Gynaecology'),
    ('OPHTHALMOLOGY/DOM', 'DIPLOMA IN S', 'DIPLOMA IN OPHTHALMOLOGY/DOM S'),
]
for r in rows:
    for remnant, frag, full in REJOIN:
        if r['course'] == frag and remnant in r['institute']:
            r['course'] = full
            r['institute'] = re.sub(r'\s+', ' ', r['institute'].replace(remnant, ' ', 1)).strip()
            break
    # Cardio-vascular fragment without a remnant (remnant fused elsewhere)
    if r['course'] == 'and Thoracic Surgery (Direct 6 Years Course)':
        r['course'] = '(NBEMS) Cardio Vascular and Thoracic Surgery (Direct 6 Years Course)'
        r['institute'] = re.sub(r'\s+', ' ', r['institute'].replace('(NBEMS) Cardio Vascular', ' ')).strip()

# ---- course -> (degree, specialty) ----
SPECIALTY = [  # (regex on upper-cased course, canonical specialty) — first match wins
    (r'CARDIO VASCULAR', 'Cardiothoracic Surgery'), (r'NEURO SURGERY', 'Neurosurgery'),
    (r'PLASTIC', 'Plastic Surgery'), (r'PAEDIATRIC SURGERY', 'Paediatric Surgery'),
    (r'OBST|GYNAE', 'Obstetrics & Gynaecology'), (r'PAEDIATRIC|CHILD HEALTH', 'Paediatrics'),
    (r'ANAESTHE', 'Anaesthesiology'), (r'GENERAL MEDICINE', 'General Medicine'),
    (r'GENERAL SURGERY', 'General Surgery'), (r'ORTHOPAEDIC', 'Orthopaedics'),
    (r'RADIO-?DIAGNOSIS', 'Radio-diagnosis'), (r'RADIATION ONCOLOGY|RADIOTHERAPY|RADIO-THERAPY|RADIATION MEDICINE', 'Radiation Oncology'),
    (r'NUCLEAR', 'Nuclear Medicine'), (r'OPHTHAL', 'Ophthalmology'),
    (r'E\.N\.T|OTO-?RHINO|OTORHINO', 'ENT'), (r'COMMUNITY MEDICINE|PREVENTIVE', 'Community Medicine'),
    (r'PUBLIC HEALTH', 'Public Health'), (r'EPIDEMIOLOGY', 'Epidemiology'),
    (r'PSYCHIAT|PSYCHOLOGICAL', 'Psychiatry'), (r'DERM|VENERE|LEPROSY', 'Dermatology, Venereology & Leprosy'),
    (r'TUBERCULOSIS|RESPIRATORY|PULMONARY|CHEST', 'Respiratory Medicine'),
    (r'EMERGENCY', 'Emergency Medicine'), (r'TRANSFUSION|IMMUNO-?HAEMATOLOGY', 'Transfusion Medicine'),
    (r'FAMILY MEDICINE', 'Family Medicine'), (r'PALLIATIVE', 'Palliative Medicine'),
    (r'GERIATRIC', 'Geriatric Medicine'), (r'SPORTS', 'Sports Medicine'),
    (r'PHYSICAL MED|PHY\. MEDICINE', 'Physical Medicine & Rehabilitation'),
    (r'HOSPITAL ADMINISTRATION', 'Hospital Administration'), (r'TROPICAL', 'Tropical Medicine'),
    (r'TRAUMATOLOGY', 'Traumatology & Surgery'), (r'LABORATORY MEDICINE', 'Laboratory Medicine'),
    (r'DIABETOLOGY', 'Diabetology'), (r'BACTERIOLOGY', 'Bacteriology'),
    (r'CLINICAL PATHOLOGY', 'Clinical Pathology'), (r'PATHOLOGY', 'Pathology'),
    (r'MICROBIOLOGY', 'Microbiology'), (r'PHARMACOLOGY', 'Pharmacology'), (r'PHYSIOLOGY', 'Physiology'),
    (r'BIOCHEMISTRY', 'Biochemistry'), (r'ANATOMY', 'Anatomy'), (r'FORENSIC', 'Forensic Medicine'),
]
def degree_of(c):
    u = c.upper()
    if u.startswith('(NBEMS-DIPLOMA)'): return 'DNB Diploma'
    if u.startswith('(NBEMS)'): return 'DrNB' if 'DIRECT 6 YEARS' in u else 'DNB'
    if u.startswith('M.CH'): return 'MCh'
    if u.startswith('M.P.H'): return 'MPH'
    if u.startswith(('DIPLOMA', 'DIP', 'PG DIPLOMA')): return 'Diploma'
    if u.startswith('M.S.'): return 'MS'
    if u.startswith('MD/MS'): return 'MD'
    if u.startswith('M.D'): return 'MD'
    return None
def specialty_of(c):
    u = c.upper()
    for pat, name in SPECIALTY:
        if re.search(pat, u): return name
    return None

# ---- institute -> (display name, state) ----
STATES = ['Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
          'Dadra and Nagar Haveli', 'Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
          'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra',
          'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim',
          'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal']
ALIASES = {'delhi (nct)': 'Delhi', 'new delhi': 'Delhi', 'jammu and kashmir': 'Jammu and Kashmir', 'jammu & kashmir': 'Jammu and Kashmir',
           'orissa': 'Odisha', 'pondicherry': 'Puducherry', 'uttaranchal': 'Uttarakhand', 'chattisgarh': 'Chhattisgarh'}
def state_of(s):
    low = s.lower()
    m = re.search(r',\s*([A-Za-z &().]+?)\s*,\s*\d{6}\s*$', s)
    if m:
        cand = m.group(1).strip().lower()
        if cand in ALIASES: return ALIASES[cand]
        for st in STATES:
            if cand == st.lower(): return st
    best, pos = None, -1
    for st in STATES + list(ALIASES):
        i = low.rfind(st.lower())
        if i > pos: best, pos = (ALIASES.get(st, st) if st in ALIASES else st), i
    return best
def display_name(s):
    s = re.sub(r'\s*,\s*,\s*', ', ', s)
    m = re.match(r'^(.*?[^\s,]),(?=\S)', s)  # name ends at the first comma not followed by a space
    name = (m.group(1) if m else s.split(',')[0]).strip(' ,')
    return re.sub(r'\s+', ' ', name)
def inst_has_aiq(c): return bool(c['quotas']['All India'])
def key_of(s): return re.sub(r'[^a-z0-9]', '', s.lower())

QUOTA = {'All India': 'AIQ', 'DNB Quota': 'AIQ', 'Self-Financed Merit Seat/(Paid Seat Quota)': 'DEEMED', 'Non-Resident Indian': 'NRI',
         'Delhi University Quota': 'INSTITUTIONAL', 'IP University Quota': 'INSTITUTIONAL', 'Aligarh Muslim University': 'INSTITUTIONAL',
         'Banaras Hindu University': 'INSTITUTIONAL'}  # minority quotas skipped
ELIGIBLE = {'GENERAL': ['Open'], 'EWS': ['Open', 'EWS'], 'OBC': ['Open', 'OBC'], 'SC': ['Open', 'SC'], 'ST': ['Open', 'ST']}

skipped = Counter(); inst = {}; seats = defaultdict(list)  # (inst_key, branch, quota, allotted_cat) -> ranks
branch_meta = {}
for r in rows:
    q = QUOTA.get(r['quota'])
    if not q: skipped['minority quota'] += 1; continue
    if 'PwD' in r['allotted_category']: skipped['PwD seat'] += 1; continue
    deg, spec = degree_of(r['course']), specialty_of(r['course'])
    if not deg or not spec: skipped['unrecognised course: ' + r['course']] += 1; continue
    branch = f'{deg} {spec}'
    branch_meta[branch] = (deg, spec)
    k = key_of(r['institute'])
    if k not in inst:
        inst[k] = {'raw': r['institute'], 'name': display_name(r['institute']), 'state': state_of(r['institute']), 'quotas': Counter(), 'degrees': Counter()}
    inst[k]['quotas'][r['quota']] += 1; inst[k]['degrees'][deg] += 1
    seats[(k, branch, q, r['allotted_category'])].append(int(r['rank']))

# ---- merge spellings of the same institution: same name, state and PIN ----
STATE_OVERRIDES = {'salhospitalandmedicalinstitute': 'Gujarat', 'instituteofintegratedmedicalsciencesgovtmedicalcollegepalakkad': 'Kerala',
                   'combineddistrichospitalkannauj': 'Uttar Pradesh'}
for k, v in inst.items():
    if not v['state']:
        for frag, st in STATE_OVERRIDES.items():
            if k.startswith(frag): v['state'] = st
def norm_name(n, state):
    n = re.sub(r',\s*(%s)\s*$' % '|'.join(map(re.escape, STATES + ['New Delhi', 'India'])), '', n.strip(), flags=re.I)
    return re.sub(r'[^a-z0-9]', '', n.lower())
def pin_of(raw):
    m = re.search(r'(\d{6})\s*$', raw); return m.group(1) if m else None
ident = {}
for k, v in inst.items(): ident[k] = (norm_name(v['name'], v['state']), v['state'], pin_of(v['raw']))
pins = defaultdict(set)
for k, (n, st, pin) in ident.items():
    if pin: pins[(n, st)].add(pin)
for k, (n, st, pin) in list(ident.items()):
    if not pin and len(pins[(n, st)]) == 1: ident[k] = (n, st, next(iter(pins[(n, st)])))
canon = {}   # identity -> merged record
alias = {}   # raw institute key -> identity
for k, v in inst.items():
    i = ident[k]; alias[k] = i
    if i not in canon:
        canon[i] = {'raw': v['raw'], 'name': v['name'], 'state': v['state'], 'quotas': Counter(), 'degrees': Counter(), 'variants': []}
    c = canon[i]; c['quotas'].update(v['quotas']); c['degrees'].update(v['degrees']); c['variants'].append(v['raw'])
    # prefer the spelling used for MD/MS seats, and title case over ALL CAPS
    if (v['quotas']['All India'] and not inst_has_aiq(c)) if False else (v['name'] != v['name'].upper() and c['name'] == c['name'].upper()):
        c['name'], c['raw'] = v['name'], v['raw']
merged = len(inst) - len(canon)

# college type
for v in canon.values():
    qs = v['quotas']
    if qs['Self-Financed Merit Seat/(Paid Seat Quota)'] or qs['Non-Resident Indian']: v['type'] = 'DEEMED'
    elif qs['All India'] or any(qs[x] for x in ('Delhi University Quota', 'IP University Quota', 'Aligarh Muslim University', 'Banaras Hindu University')): v['type'] = 'GOVERNMENT'
    else: v['type'] = 'DNB'

# unique display names: add city (or state), then PIN, only where names collide
def city_of(raw, state):
    parts = [p.strip() for p in re.split(r',', raw) if p.strip()]
    for i in range(len(parts) - 1, 0, -1):
        if state and parts[i].lower().startswith(state.lower()[:5]) and i > 0:
            cand = re.sub(r'[-\s]*\d{6}.*$', '', parts[i - 1]).strip()
            if cand and len(cand.split()) <= 3 and not re.search(r'\d', cand) and cand.lower() != state.lower():
                return cand.title()
    return None
def bump(level):
    groups = defaultdict(list)
    for i, v in canon.items(): groups[v['name'].lower()].append(i)
    for ids in groups.values():
        if len(ids) < 2: continue
        for i in ids:
            v = canon[i]
            if level == 0: v['name'] = f"{v['name']}, {city_of(v['raw'], v['state']) or v['state'] or 'India'}"
            elif level == 1: v['name'] = f"{v['name']}, {v['state'] or 'India'}"
            else: v['name'] = f"{v['name']} ({i[2] or 'PIN n/a'})"
for level in range(3): bump(level)
assert len({v['name'].lower() for v in canon.values()}) == len(canon), 'display names still collide'

# cutoffs per candidate category
cut = []
groups = defaultdict(dict)
for (k, b, q, cat), ranks in seats.items(): groups[(alias[k], b, q)].setdefault(cat, []).extend(ranks)
for (k, b, q), bycat in groups.items():
    for cand, allowed in ELIGIBLE.items():
        ranks = [x for c in allowed for x in bycat.get(c, [])]
        if not ranks: continue
        cut.append({'college_name': canon[k]['name'], 'branch_name': b, 'quota': q, 'category': cand, 'sub_category': 'NONE',
                    'closing_rank': max(ranks), 'opening_rank': min(ranks), 'seat_count': len(ranks), 'round': ROUND,
                    'academic_year': YEAR, 'source': SOURCE})

popularity = Counter(); [popularity.__setitem__(b, popularity[b] + len(r)) for (k, b, q, c), r in seats.items()]
w = lambda name, fields, data: csv.DictWriter(open(f'{OUT}/{name}', 'w', newline=''), fieldnames=fields)
f = open(f'{OUT}/colleges.csv', 'w', newline=''); cw = csv.DictWriter(f, fieldnames=['name', 'state', 'type', 'city', 'short_name', 'university', 'mcc_institute'])
cw.writeheader(); [cw.writerow({'name': v['name'], 'state': v['state'] or '', 'type': v['type'], 'city': '', 'short_name': '', 'university': '', 'mcc_institute': v['raw']}) for v in canon.values()]; f.close()
f = open(f'{OUT}/branches.csv', 'w', newline=''); bw = csv.DictWriter(f, fieldnames=['name', 'degree', 'specialty', 'popularity'])
bw.writeheader(); [bw.writerow({'name': b, 'degree': d, 'specialty': s, 'popularity': popularity[b]}) for b, (d, s) in sorted(branch_meta.items())]; f.close()
f = open(f'{OUT}/cutoffs.csv', 'w', newline=''); fw = csv.DictWriter(f, fieldnames=list(cut[0].keys()))
fw.writeheader(); fw.writerows(cut); f.close()

print('allotments used', sum(len(r) for r in seats.values()), 'of', len(rows), '| skipped', dict(skipped))
print('colleges', len(canon), '(merged', merged, 'duplicate spellings)', Counter(v['type'] for v in canon.values()), '| no state:', sum(1 for v in canon.values() if not v['state']))
print('branches', len(branch_meta), '| cutoff rows', len(cut))
print('cutoffs by quota', Counter(c['quota'] for c in cut)); print('cutoffs by category', Counter(c['category'] for c in cut))
print('colleges by state (top 12)', Counter(v['state'] for v in canon.values()).most_common(12))
