import Link from 'next/link';
import { EXAM_YEAR, LATEST_CUTOFF_YEAR, siteConfig } from '@/config/site';
import { pageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/json-ld';
import { graph, breadcrumbSchema, faqSchema, articleSchema } from '@/lib/seo/structured-data';
import { MarketingHeader } from '@/features/landing/components/marketing-header';
import { MarketingFooter } from '@/features/landing/components/marketing-footer';
import {
  AIQ_RESERVATION, COUNSELLING_SOURCES, EXAM_FACTS, EXIT_RULES, FEES, GUIDE_PUBLISHED,
  GUIDE_UPDATED, JOINING_DOCUMENTS, MCC_PG_LAST_YEAR, SCHEDULE, SCHEDULE_NOTE, STATE_AUTHORITIES,
  currentStage, formatDay, formatLong, formatRange, todayInIndia,
} from '@/lib/content/counselling';

/**
 * Static, regenerated hourly. The "where counselling stands" line is computed
 * from MCC's schedule at render time, so an hour is the most it can lag.
 * The page reads no session — the header resolves login state on the client —
 * which keeps it cacheable at the CDN for every crawler and visitor.
 */
export const revalidate = 3600;

const PATH = '/neet-pg-counselling';
/** Served by app/og/neet-pg-counselling/route.tsx. */
const OG_IMAGE_PATH = '/og/neet-pg-counselling';
const HEADLINE = `NEET PG Counselling ${EXAM_YEAR}: Dates, Rounds, Fees & Process`;
const DESCRIPTION =
  `NEET PG ${EXAM_YEAR} counselling: MCC round-wise dates, registration fee and security deposit, ` +
  'free exit and forfeiture rules, documents and state counselling portals — from the official bulletin.';

export const metadata = pageMetadata({
  title: `NEET PG Counselling ${EXAM_YEAR}: MCC Dates, Rounds, Fees & Process`,
  description: DESCRIPTION,
  path: PATH,
  image: { url: OG_IMAGE_PATH, alt: `NEET PG Counselling ${EXAM_YEAR} — MCC dates, rounds, fees and process` },
  keywords: [
    `NEET PG counselling ${EXAM_YEAR}`,
    `MCC PG counselling ${EXAM_YEAR}`,
    'NEET PG counselling schedule',
    'NEET PG counselling dates',
    'NEET PG counselling fees',
    'NEET PG security deposit',
    'NEET PG round 1 result',
    'NEET PG stray vacancy round',
    'NEET PG free exit',
    'NEET PG state quota counselling',
    'NEET PG counselling documents',
    'NEET PG choice filling',
  ],
});

const [r1, r2, r3, stray] = SCHEDULE;

/** Visible on the page and emitted as FAQPage markup — one source, never two. */
const counsellingFaqs = [
  {
    q: `When does NEET PG ${EXAM_YEAR} counselling start?`,
    a: `MCC Round 1 registration opened on ${formatDay(r1.registration[0])} ${EXAM_YEAR} and closes on ${formatDay(r1.registration[1])}. Choice filling runs until ${formatDay(r1.choiceFilling[1])}, and the Round 1 seat allotment result is due on ${formatDay(r1.result)}. Round 2 registration opens on ${formatDay(r2.registration[0])}, Round 3 on ${formatDay(r3.registration[0])} and the stray vacancy round on ${formatDay(stray.registration[0])}. These are MCC's tentative dates; confirm them on mcc.nic.in.`,
  },
  {
    q: 'How many rounds of NEET PG counselling does MCC conduct?',
    a: 'Four: Round 1, Round 2, Round 3 and the stray vacancy round. All four are online and cover All India Quota, deemed university, central university and DNB seats.',
  },
  {
    q: `What is the fee for NEET PG counselling ${EXAM_YEAR}?`,
    a: 'For All India Quota seats, UR and EWS candidates pay a ₹1,000 registration fee and a ₹25,000 security deposit; SC, ST, OBC and PwD candidates pay ₹500 and ₹10,000. For deemed universities every candidate pays ₹5,000 and ₹2,00,000. If you apply for both, you pay only the deemed university amount. The registration fee is non-refundable; the deposit is refundable.',
  },
  {
    q: 'When is the NEET PG security deposit forfeited?',
    a: 'If you are allotted a seat in Round 2 or any later round and do not join it, or if your admission is cancelled because of wrong information or missing documents. Otherwise MCC refunds the deposit after all rounds end, to the account you paid from, without interest.',
  },
  {
    q: 'What is free exit in NEET PG counselling?',
    a: 'Free exit applies only in Round 1. If you do not join your Round 1 seat, you keep your security deposit and can take part in Round 2. From Round 2 onwards, leaving an allotted seat forfeits the deposit.',
  },
  {
    q: 'What is the difference between freeze and float in MCC counselling?',
    a: 'After an allotment you choose. Freeze means you keep the seat and do not want an upgrade: you report to the institute in person for document verification and admission. Float means you want an upgrade in the next round: you join online on the MCC portal, the institute verifies your uploaded documents online, and you keep that seat unless you are upgraded.',
  },
  {
    q: 'How many choices should I fill in NEET PG choice filling?',
    a: 'There is no limit. MCC advises 30–40 choices, in true order of preference. Choices you do not lock are locked automatically at the deadline, and locked choices cannot be changed.',
  },
  {
    q: 'Can I take part in both AIQ and state quota counselling?',
    a: 'Yes. Register with MCC and with your state authority separately. If you hold an AIQ seat and later want a state seat, you must resign the AIQ seat first. That is free in Round 1 and forfeits your deposit in Round 2.',
  },
  {
    q: 'Who can take part in the stray vacancy round?',
    a: 'Candidates who did not register in Rounds 1–3, and registered candidates who were not allotted any seat in an earlier round. A stray vacancy seat must be joined; not joining forfeits the deposit.',
  },
  {
    q: 'Are deemed university and DNB seats part of MCC counselling?',
    a: 'Yes. MCC fills 100% of deemed university seats and 100% of DNB seats in the same four rounds as All India Quota seats, alongside the seats of central universities and institutes such as DU, BHU and AMU.',
  },
];

const toc = [
  { id: 'schedule', label: 'Schedule' },
  { id: 'seats', label: 'AIQ vs state quota' },
  { id: 'process', label: 'Step-by-step process' },
  { id: 'fees', label: 'Fees & deposit' },
  { id: 'exit-rules', label: 'Exit & forfeiture rules' },
  { id: 'documents', label: 'Documents' },
  { id: 'choice-filling', label: 'Choice filling' },
  { id: 'state-counselling', label: 'State counselling' },
  { id: 'faq', label: 'FAQ' },
];

const steps = [
  {
    title: 'Register and pay',
    body: 'Register on mcc.nic.in with the mobile number and email you used with NBEMS, then pay the non-refundable registration fee and the refundable security deposit. Each candidate may submit only one registration.',
  },
  {
    title: 'Fill and lock choices',
    body: 'Add college and course choices in order of preference. There is no limit; MCC advises 30–40. Choices still unlocked at the deadline lock automatically, and locked choices cannot be edited.',
  },
  {
    title: 'Seat allotment',
    body: 'MCC allots seats by NEET PG rank and your choice order, applying reservation rules. If no seat is allotted, you stay eligible for the next round.',
  },
  {
    title: 'Choose freeze or float',
    body: 'Freeze: keep the seat, no upgrade — report to the institute in person for document verification and admission. Float: you want an upgrade — join online on the MCC portal and receive a provisional admission letter while you wait for the next round.',
  },
  {
    title: 'Upload your documents',
    body: 'Freeze and float candidates both upload clear scans of their documents once, for all rounds, within 2–3 days of the allotment result. The institute may raise queries that you must answer within the reporting window.',
  },
  {
    title: 'Report or upgrade',
    body: 'Freeze candidates report within the reporting dates. After the Round 3 result, every allotted candidate, and every float candidate who was not upgraded, must report in person.',
  },
];

const choiceTips = [
  {
    title: 'List seats in true preference order',
    body: 'MCC gives you the highest choice you can get at your rank, so putting a dream seat above a safer one never costs you the safer one.',
  },
  {
    title: 'Fill enough choices',
    body: 'MCC advises 30–40. A short list is how candidates end a round with no seat at a rank that could have got one.',
  },
  {
    title: "Use last year's closing ranks as a guide",
    body: "MCC publishes previous years' allotments under Archives on mcc.nic.in. They are indicative, not a promise for this year.",
  },
  {
    title: 'Check fees, bond and stipend first',
    body: 'Especially for deemed and high-fee colleges. MCC shows what institutes report but takes no responsibility for it — confirm with the college before you add it.',
  },
  {
    title: 'Lock early and save a printout',
    body: 'Unlocked choices are locked at the deadline as they stand, and MCC cannot unlock them for you.',
  },
];

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="scroll-mt-24 text-[26px] font-normal leading-[1.15] tracking-[-0.022em] text-[#15191a] sm:text-[30px]"
    >
      {children}
    </h2>
  );
}

function hostname(url: string) {
  return new URL(url).hostname.replace(/^www\./, '');
}

/**
 * A table on wide screens; a stack of labelled cards on phones. A sideways-
 * scrolling table hides its right-hand columns on a phone, and those were the
 * columns that mattered (dates, deposit, what a rule means, the state portal).
 * The first cell of each row is its header.
 */
function DataTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: readonly string[];
  rows: readonly { key: string; cells: readonly React.ReactNode[] }[];
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-[12px] border border-black/[0.08] bg-white">
      <table className="block w-full border-collapse sm:table">
        <caption className="sr-only">{caption}</caption>
        <thead className="hidden bg-[#faf9f6] sm:table-header-group">
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col" className="px-4 py-3 text-left text-[12.5px] font-medium text-[#4e5654]">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="block divide-y divide-black/[0.06] sm:table-row-group">
          {rows.map((row) => (
            <tr key={row.key} className="block px-4 py-3.5 sm:table-row sm:p-0">
              {row.cells.map((cell, i) =>
                i === 0 ? (
                  <th
                    key={i}
                    scope="row"
                    className="block text-left text-[15px] font-medium text-[#15191a] sm:table-cell sm:px-4 sm:py-3 sm:align-top sm:text-[14px]"
                  >
                    {cell}
                  </th>
                ) : (
                  <td
                    key={i}
                    data-label={columns[i]}
                    className="mt-2 block text-[14px] leading-relaxed text-[#15191a] before:block before:text-[12px] before:text-[#6b7472] before:content-[attr(data-label)] sm:mt-0 sm:table-cell sm:px-4 sm:py-3 sm:align-top sm:before:content-none"
                  >
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function NeetPgCounsellingPage() {
  const today = todayInIndia();
  const stage = currentStage(today);

  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: `NEET PG Counselling ${EXAM_YEAR}`, path: PATH },
          ]),
          articleSchema({
            headline: HEADLINE,
            description: DESCRIPTION,
            path: PATH,
            datePublished: GUIDE_PUBLISHED,
            dateModified: GUIDE_UPDATED,
            image: OG_IMAGE_PATH,
          }),
          faqSchema(counsellingFaqs, PATH),
        )}
      />

      <MarketingHeader />

      <main id="main" className="mx-auto max-w-[1100px] px-5 pb-24 pt-10 lg:px-10 lg:pt-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-[#6b7472]">
          <Link href="/" className="hover:text-[#15191a]">Home</Link>
          <span aria-hidden> / </span>
          <span className="text-[#15191a]">NEET PG Counselling {EXAM_YEAR}</span>
        </nav>

        {/* Hero */}
        <div className="max-w-[760px]">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#e8f1ef] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            <span className="text-[12px] font-medium text-[#0b544e]">
              Updated <time dateTime={GUIDE_UPDATED}>{formatLong(GUIDE_UPDATED)}</time> · based on
              MCC&apos;s {EXAM_YEAR} information bulletin
            </span>
          </p>
          <h1 className="text-[34px] font-normal leading-[1.1] tracking-[-0.028em] text-[#15191a] sm:text-[44px]">
            {HEADLINE}
          </h1>
          <p className="mt-5 text-[17px] leading-[1.6] text-[#4e5654]">
            NBEMS declared NEET PG {EXAM_YEAR} results on {formatLong(EXAM_FACTS.resultDate)}, and MCC&apos;s
            All India Quota counselling {stage ? 'is under way' : 'has concluded for this cycle'}. This guide covers the round-wise schedule, what
            you pay and when you can lose your deposit, the new freeze-and-float joining rules, the
            documents you need, and where to register for state quota counselling.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/predictor"
              className="rounded-[9px] bg-primary px-[24px] py-[13px] text-[15px] font-medium text-white transition-opacity hover:opacity-90"
            >
              Check colleges for my score
            </Link>
            <Link
              href="/neet-pg-cutoffs"
              className="rounded-[9px] border border-black/[0.14] bg-white px-[22px] py-[12px] text-[15px] font-medium text-[#15191a] transition-colors hover:bg-[#faf9f6]"
            >
              View {LATEST_CUTOFF_YEAR} cutoffs
            </Link>
          </div>
        </div>

        {/* Live status */}
        <section
          aria-labelledby="status"
          className="mt-10 rounded-[14px] border border-[#0b544e]/20 bg-[#e8f1ef] p-5 sm:p-6"
        >
          <h2 id="status" className="text-[12px] font-medium uppercase tracking-[.09em] text-[#0b544e]">
            Where counselling stands
          </h2>
          <p className="mt-2 text-[20px] leading-snug text-[#15191a]">
            {stage ?? `All four MCC rounds for ${EXAM_YEAR} have closed.`}
          </p>
          <p className="mt-2 text-[13px] text-[#4e5654]">
            As of <time dateTime={today}>{formatLong(today)}</time>. Confirm every deadline on{' '}
            <a href="https://mcc.nic.in/pg-medical-counselling/" rel="noopener" className="underline underline-offset-2">
              mcc.nic.in
            </a>
            .
          </p>
        </section>

        {/* Key facts */}
        <dl className="mt-6 grid grid-cols-2 gap-4 rounded-[14px] border border-black/[0.08] bg-[#faf9f6] p-5 sm:grid-cols-3 sm:p-6 lg:grid-cols-5">
          {[
            { label: 'Exam held', value: formatDay(EXAM_FACTS.examDate), sub: '180 questions · 720 marks' },
            { label: 'Result declared', value: formatDay(EXAM_FACTS.resultDate), sub: `${EXAM_FACTS.candidatesAppeared} appeared` },
            { label: 'MCC rounds', value: '4', sub: 'R1 · R2 · R3 · Stray' },
            { label: `PG seats via MCC, ${MCC_PG_LAST_YEAR.year}`, value: MCC_PG_LAST_YEAR.seats, sub: `across ${MCC_PG_LAST_YEAR.institutes} institutes` },
            { label: `Candidates, ${MCC_PG_LAST_YEAR.year}`, value: MCC_PG_LAST_YEAR.candidates, sub: 'in MCC PG counselling' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-1">
              <dt className="text-[12px] text-[#6b7472]">{s.label}</dt>
              <dd className="text-[24px] leading-none tabular-nums text-[#15191a]">{s.value}</dd>
              <dd className="text-[12px] text-[#6b7472]">{s.sub}</dd>
            </div>
          ))}
        </dl>

        {/* On this page */}
        <nav aria-label="On this page" className="mt-10">
          <p className="text-[13px] font-medium text-[#15191a]">On this page</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {toc.map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  className="inline-block rounded-full border border-black/[0.10] bg-white px-3 py-1.5 text-[13px] text-[#4e5654] transition-colors hover:bg-[#faf9f6] hover:text-[#15191a]"
                >
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Schedule */}
        <section className="mt-14" aria-labelledby="schedule">
          <SectionHeading id="schedule">NEET PG {EXAM_YEAR} counselling schedule (MCC)</SectionHeading>
          <p className="mt-4 max-w-[68ch] text-[16px] leading-relaxed text-[#4e5654]">
            MCC runs the same four rounds for All India Quota, deemed university, central university and
            DNB seats. These are MCC&apos;s tentative dates and MCC can revise them, so check mcc.nic.in
            before every deadline.
          </p>
          <DataTable
            caption={`MCC NEET PG ${EXAM_YEAR} counselling schedule by round`}
            columns={['Round', 'Registration & payment', 'Choice filling', 'Result', 'Reporting']}
            rows={SCHEDULE.map((r) => ({
              key: r.round,
              cells: [
                r.round,
                formatRange(r.registration),
                formatRange(r.choiceFilling),
                formatDay(r.result),
                formatRange(r.reporting),
              ],
            }))}
          />
          <p className="mt-3 max-w-[68ch] text-[13px] leading-relaxed text-[#6b7472]">
            All dates {EXAM_YEAR}. {SCHEDULE_NOTE}
          </p>
        </section>

        {/* AIQ vs state */}
        <section className="mt-16" aria-labelledby="seats">
          <SectionHeading id="seats">Which seats MCC fills — AIQ vs state quota</SectionHeading>
          <p className="mt-4 max-w-[68ch] text-[16px] leading-relaxed text-[#4e5654]">
            NEET PG seats are filled by two separate systems with separate registrations. Knowing which
            seats sit where is the first decision in your counselling plan.
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {[
              {
                tag: 'MCC (mcc.nic.in) — no domicile needed',
                color: 'bg-[#e8f1ef] text-[#0b544e]',
                border: 'border-[#0b544e]/20',
                points: [
                  '50% All India Quota seats of state government colleges',
                  '100% of deemed university seats',
                  '100% of DNB seats',
                  'Central universities and institutes — DU, BHU, AMU, VMMC & Safdarjung, ABVIMS & RML, ESIC Basaidarapur — including their 50% institutional quota',
                  'Four rounds: R1, R2, R3 and stray vacancy',
                ],
              },
              {
                tag: 'State counselling authority',
                color: 'bg-[#fdf3e3] text-[#a07520]',
                border: 'border-amber-200',
                points: [
                  'The remaining 50% of government college seats in the state',
                  'Private college seats in the state, under state rules',
                  'Eligibility (domicile, or MBBS from the state) varies by state',
                  'Own schedule, fees, rounds and reservation rules',
                  'Separate registration on the state portal',
                ],
              },
            ].map((col) => (
              <div key={col.tag} className={`rounded-[12px] border ${col.border} bg-white p-5`}>
                <span className={`mb-4 inline-block rounded-full px-3 py-1 text-[12px] font-medium ${col.color}`}>
                  {col.tag}
                </span>
                <ul className="space-y-2.5">
                  {col.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-[14px] text-[#4e5654]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0b544e]" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <h3 className="mt-10 text-[18px] font-medium text-[#15191a]">Reservation in AIQ seats</h3>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {AIQ_RESERVATION.map((r) => (
              <li key={r.category} className="rounded-[10px] border border-black/[0.08] bg-white px-4 py-3">
                <span className="block text-[22px] leading-none tabular-nums text-[#15191a]">{r.share}</span>
                <span className="mt-1.5 block text-[12.5px] text-[#6b7472]">{r.category}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 max-w-[68ch] text-[13.5px] leading-relaxed text-[#6b7472]">
            PwD reservation needs an eligibility certificate from an MCC-designated medical board; no
            other disability certificate is accepted. State quota seats follow each state&apos;s own
            reservation rules.
          </p>
        </section>

        {/* Process */}
        <section className="mt-16" aria-labelledby="process">
          <SectionHeading id="process">How MCC counselling works, step by step</SectionHeading>
          <ol className="mt-7 space-y-4">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-5 rounded-[12px] border border-black/[0.08] bg-white p-5">
                <span className="shrink-0 pt-0.5 text-[28px] font-normal leading-none tabular-nums text-[#c9c4ba]" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-medium text-[#15191a]">{step.title}</h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-[#4e5654]">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Fees */}
        <section className="mt-16" aria-labelledby="fees">
          <SectionHeading id="fees">Registration fee and security deposit</SectionHeading>
          <DataTable
            caption={`MCC NEET PG ${EXAM_YEAR} counselling fees by seat type and category`}
            columns={['Seat type and category', 'Registration fee (non-refundable)', 'Security deposit (refundable)']}
            rows={FEES.map((f) => ({
              key: `${f.scheme}-${f.category}`,
              cells: [`${f.scheme} — ${f.category}`, f.registration, f.deposit],
            }))}
          />
          <p className="mt-3 max-w-[68ch] text-[14px] leading-relaxed text-[#4e5654]">
            Applying for both AIQ and deemed seats? You pay only the higher deemed university amount. MCC
            refunds the deposit after all rounds end, to the account you paid from, without interest —
            unless it is forfeited under the rules below.
          </p>
        </section>

        {/* Exit rules */}
        <section className="mt-16" aria-labelledby="exit-rules">
          <SectionHeading id="exit-rules">Free exit, forfeiture and resignation rules</SectionHeading>
          <p className="mt-4 max-w-[68ch] text-[16px] leading-relaxed text-[#4e5654]">
            Each round has its own rules, and once a round starts its rules apply to everyone — including
            candidates holding a seat from an earlier round.
          </p>
          <DataTable
            caption="What happens if you leave an MCC seat, by round"
            columns={['Round', 'Rule', 'What it means']}
            rows={EXIT_RULES.map((r) => ({
              key: r.round,
              cells: [r.round, <span key="rule" className="font-medium sm:whitespace-nowrap">{r.rule}</span>, r.detail],
            }))}
          />
          <p className="mt-3 max-w-[68ch] text-[14px] leading-relaxed text-[#4e5654]">
            The deposit is also forfeited in any round if an admission is cancelled because of wrong
            information at registration or documents you could not produce.
          </p>
        </section>

        {/* Documents */}
        <section className="mt-16" aria-labelledby="documents">
          <SectionHeading id="documents">Documents needed at joining</SectionHeading>
          <p className="mt-4 max-w-[68ch] text-[16px] leading-relaxed text-[#4e5654]">
            Carry originals. Colleges do not accept a letter saying your originals are deposited
            elsewhere, and some ask for more than this list, so check with your allotted college.
          </p>
          <ul className="mt-6 grid gap-2.5 md:grid-cols-2">
            {JOINING_DOCUMENTS.map((d) => (
              <li
                key={d}
                className="flex items-start gap-3 rounded-[10px] border border-black/[0.08] bg-white px-4 py-3 text-[14px] leading-relaxed text-[#15191a]"
              >
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0b544e]" aria-hidden />
                {d}
              </li>
            ))}
          </ul>
        </section>

        {/* Choice filling */}
        <section className="mt-16" aria-labelledby="choice-filling">
          <SectionHeading id="choice-filling">How to build your choice list</SectionHeading>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {choiceTips.map((tip) => (
              <li key={tip.title} className="rounded-[12px] border border-black/[0.08] bg-white p-5">
                <h3 className="font-medium text-[#15191a]">{tip.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#4e5654]">{tip.body}</p>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-[16px] border border-black/[0.08] bg-[#faf9f6] p-6 sm:p-8">
            <h3 className="text-[22px] font-normal tracking-[-0.02em] text-[#15191a]">
              See which seats your score can reach
            </h3>
            <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-[#4e5654]">
              Enter your NEET PG {EXAM_YEAR} score and profile. The predictor estimates your rank range and
              matches it against {LATEST_CUTOFF_YEAR} closing ranks across AIQ, state and deemed seats, so you
              can build a realistic choice list before locking closes.
            </p>
            <Link
              href="/predictor"
              className="mt-6 inline-block rounded-[9px] bg-primary px-[24px] py-[13px] text-[15px] font-medium text-white transition-opacity hover:opacity-90"
            >
              Start free prediction
            </Link>
          </div>
        </section>

        {/* State counselling */}
        <section className="mt-16" aria-labelledby="state-counselling">
          <SectionHeading id="state-counselling">State quota counselling authorities</SectionHeading>
          <p className="mt-4 max-w-[68ch] text-[16px] leading-relaxed text-[#4e5654]">
            Each state fills its own quota on its own schedule. MCC registration does not cover state
            counselling, so register on your state&apos;s portal as well.
          </p>
          <DataTable
            caption="NEET PG state quota counselling authorities and official websites"
            columns={['State', 'Counselling authority', 'Official website']}
            rows={STATE_AUTHORITIES.map((s) => ({
              key: s.state,
              cells: [
                s.state,
                s.authority,
                <a key="url" href={s.url} rel="noopener" className="text-[#0b544e] underline underline-offset-2">
                  {hostname(s.url)}
                </a>,
              ],
            }))}
          />
          <p className="mt-3 max-w-[68ch] text-[14px] leading-relaxed text-[#4e5654]">
            Delhi has no separate state round: MCC fills the institutional quota of Delhi University and
            the IP University-affiliated central institutes alongside AIQ. If you hold an AIQ seat and
            want a state seat, resign the AIQ seat first — free in Round 1, with forfeiture in Round 2.
          </p>
        </section>

        {/* FAQ */}
        <section className="mt-16" aria-labelledby="faq">
          <SectionHeading id="faq">Frequently asked questions</SectionHeading>
          <div className="mt-6 flex max-w-3xl flex-col gap-3">
            {counsellingFaqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-[11px] border border-black/[0.08] bg-white px-5 py-4 shadow-[0_1px_3px_rgba(21,25,26,.04)]"
              >
                <summary className="cursor-pointer list-none marker:content-none [&::-webkit-details-marker]:hidden">
                  {/* A heading is allowed directly inside <summary>, not inside a span within it. */}
                  <h3 className="flex items-center justify-between gap-4 text-[14.5px] font-medium leading-snug text-[#15191a]">
                    <span>{f.q}</span>
                    <span className="shrink-0 font-normal text-[#6b7472] transition-transform group-open:rotate-45" aria-hidden>+</span>
                  </h3>
                </summary>
                <p className="mt-3 text-[14px] leading-relaxed text-[#4e5654]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Sources */}
        <section className="mt-16 rounded-[12px] border border-black/[0.08] bg-[#faf9f6] p-6" aria-labelledby="sources">
          <h2 id="sources" className="text-[17px] font-medium text-[#15191a]">Sources</h2>
          <ul className="mt-3 space-y-2 text-[14px]">
            {COUNSELLING_SOURCES.map((s) => (
              <li key={s.url}>
                <a href={s.url} rel="noopener" className="text-[#0b544e] underline underline-offset-2">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[13px] leading-relaxed text-[#6b7472]">
            {siteConfig.brand} is an independent planning tool and is not affiliated with MCC, NBEMS or any
            state counselling authority. If anything here differs from mcc.nic.in, follow mcc.nic.in.
          </p>
        </section>

        {/* Related */}
        <section className="mt-12" aria-labelledby="related">
          <h2 id="related" className="text-[22px] font-normal tracking-[-0.02em] text-[#15191a]">
            Related on {siteConfig.brand}
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: '/', label: `NEET PG ${EXAM_YEAR} Rank & College Predictor`, sub: 'Estimate your rank range and shortlist colleges' },
              { href: '/neet-pg-cutoffs', label: `NEET PG ${LATEST_CUTOFF_YEAR} Cutoffs`, sub: 'College and branch-wise closing ranks' },
              { href: '/sample-report', label: 'Sample Counselling Report', sub: 'See what a full report contains' },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex flex-col gap-1 rounded-[10px] border border-black/[0.08] bg-white px-4 py-3.5 transition-colors hover:bg-[#faf9f6]"
                >
                  <span className="text-[14px] font-medium text-[#15191a]">{link.label}</span>
                  <span className="text-[12.5px] text-[#6b7472]">{link.sub}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <MarketingFooter />
    </>
  );
}
