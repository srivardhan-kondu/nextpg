/**
 * NEET PG 2026 counselling facts, kept in one place.
 *
 * Every figure here comes from an official source listed in `COUNSELLING_SOURCES`:
 * the MCC information bulletin and schedule, or NBEMS. The guide page, its FAQ
 * markup, the homepage notice and the sitemap all read from this file, so a
 * correction made here reaches all of them. When MCC revises a date, change it
 * here and bump `GUIDE_UPDATED`.
 */

/** ISO dates (YYYY-MM-DD). `GUIDE_UPDATED` drives the visible date, JSON-LD and the sitemap. */
export const GUIDE_PUBLISHED = '2026-10-21';
export const GUIDE_UPDATED = '2026-10-21';

/** NBEMS announcements for the 2026 exam. */
export const EXAM_FACTS = {
  examDate: '2026-08-30',
  resultDate: '2026-09-24',
  candidatesAppeared: '2,65,960',
} as const;

/** MCC's PG counselling volume for 2025, from the year-on-year table in the 2026 bulletin. */
export const MCC_PG_LAST_YEAR = {
  year: 2025,
  seats: '28,750',
  institutes: '1,985',
  candidates: '1,03,596',
} as const;

export type ScheduleRound = {
  round: string;
  registration: readonly [string, string];
  choiceFilling: readonly [string, string];
  result: string;
  reporting: readonly [string, string];
};

/** MCC's tentative 2026 schedule for AIQ, deemed, central university and DNB seats. */
export const SCHEDULE = [
  {
    round: 'Round 1',
    registration: ['2026-10-12', '2026-10-21'],
    choiceFilling: ['2026-10-13', '2026-10-22'],
    result: '2026-10-24',
    reporting: ['2026-10-26', '2026-11-02'],
  },
  {
    round: 'Round 2',
    registration: ['2026-11-06', '2026-11-11'],
    choiceFilling: ['2026-11-07', '2026-11-12'],
    result: '2026-11-14',
    reporting: ['2026-11-16', '2026-11-23'],
  },
  {
    round: 'Round 3',
    registration: ['2026-11-26', '2026-12-01'],
    choiceFilling: ['2026-11-27', '2026-12-02'],
    result: '2026-12-04',
    reporting: ['2026-12-05', '2026-12-12'],
  },
  {
    round: 'Stray vacancy round',
    registration: ['2026-12-16', '2026-12-21'],
    choiceFilling: ['2026-12-16', '2026-12-21'],
    result: '2026-12-24',
    reporting: ['2026-12-24', '2026-12-31'],
  },
] as const satisfies readonly ScheduleRound[];

export const SCHEDULE_NOTE =
  'Registration closes at 12 noon on the last day and fee payment at 3 PM. Choice locking closes ' +
  'at 10 AM on the last day of choice filling (11:55 PM for the stray vacancy round).';

/** Registration fee is non-refundable; the security deposit is refundable (see `EXIT_RULES`). */
export const FEES = [
  { scheme: 'All India Quota', category: 'UR / EWS', registration: '₹1,000', deposit: '₹25,000' },
  { scheme: 'All India Quota', category: 'SC / ST / OBC / PwD', registration: '₹500', deposit: '₹10,000' },
  { scheme: 'Deemed universities', category: 'All categories', registration: '₹5,000', deposit: '₹2,00,000' },
] as const;

export const EXIT_RULES = [
  {
    round: 'Round 1',
    rule: 'Free exit',
    detail:
      'If you do not join your Round 1 seat, your security deposit is safe and you can take part in Round 2.',
  },
  {
    round: 'Round 2',
    rule: 'Exit with forfeiture',
    detail:
      'Not joining or resigning a Round 2 seat forfeits your security deposit. You can still enter Round 3 by paying the fee again.',
  },
  {
    round: 'Round 3',
    rule: 'Must join',
    detail:
      'Round 3 seats cannot be resigned. Not joining forfeits the deposit and you cannot take part in later rounds.',
  },
  {
    round: 'Stray vacancy',
    rule: 'Must join',
    detail: 'Not joining a stray vacancy seat forfeits the security deposit.',
  },
] as const;

/** Original documents MCC lists for joining (bulletin, Q6). Colleges may ask for more. */
export const JOINING_DOCUMENTS = [
  'MCC allotment letter',
  'NEET PG admit card and result / rank letter issued by NBEMS',
  'Class 10 certificate or birth certificate (proof of date of birth)',
  'MBBS 1st, 2nd and 3rd professional mark sheets',
  'MBBS degree or provisional pass certificate',
  'Internship completion certificate (internship must be complete by 30 September 2026)',
  'Permanent or provisional registration with a State Medical Council',
  'Photo ID: Aadhaar, passport, voter ID or driving licence',
  'SC / ST, OBC-NCL or EWS certificate in the central format, if you claim a category (OBC and EWS income based on the financial year ending 31 March 2026)',
  'PwD eligibility certificate from an MCC-designated medical board, if you claim PwD',
] as const;

/** Reservation in AIQ seats, as stated in the bulletin. */
export const AIQ_RESERVATION = [
  { category: 'SC', share: '15%' },
  { category: 'ST', share: '7.5%' },
  { category: 'OBC (non-creamy layer, central list)', share: '27%' },
  { category: 'EWS', share: '10%' },
  { category: 'PwD (horizontal)', share: '5%' },
] as const;

export type StateAuthority = { state: string; authority: string; url: string };

/** State quota counselling bodies. Each portal was checked before listing. */
export const STATE_AUTHORITIES: readonly StateAuthority[] = [
  { state: 'Andhra Pradesh', authority: 'Dr. NTR University of Health Sciences', url: 'https://drntr.uhsap.in' },
  { state: 'Assam', authority: 'Directorate of Medical Education, Assam', url: 'https://dme.assam.gov.in' },
  { state: 'Bihar', authority: 'Bihar Combined Entrance Competitive Examination Board (BCECEB)', url: 'https://bceceboard.bihar.gov.in' },
  { state: 'Gujarat', authority: 'Admission Committee for Professional Medical Courses', url: 'https://medadmgujarat.org' },
  { state: 'Haryana', authority: 'Pt. B.D. Sharma University of Health Sciences, Rohtak', url: 'https://uhsr.ac.in' },
  { state: 'Karnataka', authority: 'Karnataka Examinations Authority (KEA)', url: 'https://cetonline.karnataka.gov.in/kea/' },
  { state: 'Kerala', authority: 'Commissioner for Entrance Examinations (CEE)', url: 'https://cee.kerala.gov.in' },
  { state: 'Madhya Pradesh', authority: 'Directorate of Medical Education, MP', url: 'https://dme.mponline.gov.in' },
  { state: 'Maharashtra', authority: 'State Common Entrance Test Cell', url: 'https://cetcell.mahacet.org' },
  { state: 'Punjab', authority: 'Baba Farid University of Health Sciences', url: 'https://bfuhs.ac.in' },
  { state: 'Rajasthan', authority: 'Rajasthan University of Health Sciences (RUHS)', url: 'https://ruhsraj.org' },
  { state: 'Tamil Nadu', authority: 'Selection Committee, Directorate of Medical Education', url: 'https://tnmedicalselection.net' },
  { state: 'Telangana', authority: 'Kaloji Narayana Rao University of Health Sciences (KNRUHS)', url: 'https://knruhs.telangana.gov.in' },
  { state: 'Uttar Pradesh', authority: 'Directorate General of Medical Education & Training (DGME)', url: 'https://upneet.gov.in' },
  { state: 'West Bengal', authority: 'West Bengal Medical Counselling Committee (WBMCC)', url: 'https://wbmcc.nic.in' },
];

export const COUNSELLING_SOURCES = [
  { label: 'MCC — PG medical counselling (official site)', url: 'https://mcc.nic.in/pg-medical-counselling/' },
  {
    label: 'MCC NEET-PG Counselling 2026 information bulletin (draft v10, 5 October 2026)',
    url: 'https://cdnbbsr.s3waas.gov.in/s3e0f7a4d0ef9b84b83b693bbf3feb8e6e/uploads/2026/10/202610082121348550.pdf',
  },
  { label: 'NBEMS — NEET PG 2026 notices and results', url: 'https://natboard.edu.in' },
] as const;

/* ── Date helpers ─────────────────────────────────────────────────────────── */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parts(iso: string) {
  const [y = 0, m = 1, d = 1] = iso.split('-').map(Number);
  return { y, m: m - 1, d };
}

/** '2026-10-24' → '24 Oct' */
export function formatDay(iso: string): string {
  const { m, d } = parts(iso);
  return `${d} ${MONTHS[m]}`;
}

/** '2026-10-24' → '24 October 2026' */
export function formatLong(iso: string): string {
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS_LONG[m]} ${y}`;
}

/** ['2026-10-12','2026-10-21'] → '12–21 Oct'; across months → '26 Oct – 2 Nov' */
export function formatRange([from, to]: readonly [string, string]): string {
  const a = parts(from);
  const b = parts(to);
  if (from === to) return formatDay(from);
  if (a.m === b.m) return `${a.d}–${b.d} ${MONTHS[b.m]}`;
  return `${formatDay(from)} – ${formatDay(to)}`;
}

/** Today's date in India, as YYYY-MM-DD, so stage boundaries match MCC's calendar. */
export function todayInIndia(now: Date = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

/**
 * What is happening in MCC counselling on a given day, in one line.
 * Returns null once the last round has closed.
 */
export function currentStage(today: string = todayInIndia()): string | null {
  for (const r of SCHEDULE) {
    const [regStart, regEnd] = r.registration;
    const [, choiceEnd] = r.choiceFilling;
    const [reportStart, reportEnd] = r.reporting;

    if (today < regStart) return `${r.round} registration opens ${formatDay(regStart)}`;
    if (today <= regEnd) {
      return today === regEnd
        ? `${r.round} registration closes today, ${formatDay(regEnd)} (12 noon)`
        : `${r.round} registration is open until ${formatDay(regEnd)}`;
    }
    if (today <= choiceEnd) {
      return today === choiceEnd
        ? `${r.round} choice locking closes today, ${formatDay(choiceEnd)}`
        : `${r.round} choice filling is open until ${formatDay(choiceEnd)}`;
    }
    if (today < r.result) return `${r.round} seat allotment result due ${formatDay(r.result)}`;
    if (today === r.result) return `${r.round} seat allotment result expected today, ${formatDay(r.result)}`;
    if (today < reportStart) return `${r.round} reporting and joining: ${formatRange(r.reporting)}`;
    if (today <= reportEnd) return `${r.round} reporting and joining open until ${formatDay(reportEnd)}`;
  }
  return null;
}
