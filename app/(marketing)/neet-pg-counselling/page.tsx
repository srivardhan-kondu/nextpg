import Link from 'next/link';
import { EXAM_YEAR, LATEST_CUTOFF_YEAR, siteConfig } from '@/config/site';
import { pageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/json-ld';
import {
  graph, breadcrumbSchema, faqSchema, articleSchema,
} from '@/lib/seo/structured-data';
import { MarketingHeader } from '@/features/landing/components/marketing-header';
import { MarketingFooter } from '@/features/landing/components/marketing-footer';
import { auth } from '@/auth';

export const revalidate = 86400;

export const metadata = pageMetadata({
  title: `NEET PG Counselling ${EXAM_YEAR} — Complete Guide to MCC & State Quota Process`,
  description:
    `Complete guide to NEET PG ${EXAM_YEAR} counselling: MCC AIQ rounds, state quota process, ` +
    `stray vacancy round, seat allotment, how to check cutoffs — and how to predict which ` +
    `colleges you can get before results are declared.`,
  path: '/neet-pg-counselling',
  keywords: [
    `NEET PG counselling ${EXAM_YEAR}`,
    'MCC PG counselling process',
    'NEET PG AIQ counselling',
    'NEET PG state quota counselling',
    'NEET PG counselling rounds',
    'stray vacancy round NEET PG',
    'NEET PG seat allotment',
    'NEET PG counselling schedule',
    'how to register for NEET PG counselling',
    'NEET PG college list',
    'NEET PG choice filling',
  ],
});

const counsellingFaqs = [
  {
    q: `What is the NEET PG ${EXAM_YEAR} counselling schedule?`,
    a: `MCC announces the counselling schedule on mcc.nic.in after NEET PG results. Typically Round 1 begins 6–8 weeks after the result. The process includes three rounds: Round 1, Round 2, and a Stray Vacancy Round. Exact dates for ${EXAM_YEAR} will be published by NTA/MCC.`,
  },
  {
    q: 'How many rounds does MCC PG counselling have?',
    a: 'MCC conducts three rounds of NEET PG counselling: Round 1 (approximately 50% of seats filled), Round 2 (remaining AIQ seats), and the Stray Vacancy Round where unfilled seats from both rounds are offered to eligible candidates.',
  },
  {
    q: 'What documents are needed for NEET PG counselling?',
    a: 'Key documents include: NEET PG admit card and scorecard, MBBS degree/provisional pass certificate, MBBS mark sheets, internship completion certificate, caste/category certificate (if applicable), domicile certificate, ID proof (Aadhaar/passport), passport-size photographs, and a bank guarantee/demand draft for the security deposit.',
  },
  {
    q: 'Can I participate in both AIQ and state counselling?',
    a: 'Yes. You can register separately for MCC AIQ counselling and your state\'s counselling simultaneously. If you are allotted a seat in AIQ and accept it, you may not be eligible for state quota — rules vary by state. Always check your state\'s specific terms before upgrading or joining.',
  },
  {
    q: 'What happens in the stray vacancy round?',
    a: 'The Stray Vacancy Round is the last chance to fill any seat left unfilled after Rounds 1 and 2. Candidates not allotted in earlier rounds, and those who surrendered seats, can participate. Closing ranks in the stray round can be slightly more relaxed than earlier rounds for some specialties.',
  },
];

const steps = [
  {
    num: '01',
    title: 'Register on mcc.nic.in',
    body: `Pay the registration fee and security deposit. For ${EXAM_YEAR}, refer to MCC\'s official announcement for exact fee amounts.`,
  },
  {
    num: '02',
    title: 'Document verification',
    body: 'Upload scanned copies of all required documents. MCC verifies eligibility before unlocking choice filling.',
  },
  {
    num: '03',
    title: 'Choice filling',
    body: 'Shortlist and rank colleges and branches in order of preference. Use the predictor below to identify which seats are realistically within your rank before you lock choices.',
  },
  {
    num: '04',
    title: 'Seat allotment',
    body: 'MCC publishes the allotment result. You can accept the seat, upgrade in Round 2, or exit counselling.',
  },
  {
    num: '05',
    title: 'Reporting to college',
    body: 'Candidates allotted a seat must report to the college within the deadline with original documents. Failure to report forfeits the seat and the security deposit.',
  },
];

export default async function NeetPgCounsellingPage() {
  const session = await auth();

  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: `NEET PG Counselling ${EXAM_YEAR}`, path: '/neet-pg-counselling' },
          ]),
          articleSchema({
            headline: `NEET PG Counselling ${EXAM_YEAR} — Complete MCC & State Quota Guide`,
            description: `Step-by-step guide to NEET PG ${EXAM_YEAR} counselling: MCC rounds, state quota, stray vacancy, and how to predict your college.`,
            path: '/neet-pg-counselling',
            datePublished: '2025-10-01',
            dateModified: new Date().toISOString().split('T')[0],
          }),
          faqSchema(counsellingFaqs),
        )}
      />

      <MarketingHeader isLoggedIn={Boolean(session?.user)} />

      <main id="main" className="mx-auto max-w-[1440px] px-6 pb-24 pt-12 lg:px-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-[#6b7472]">
          <Link href="/" className="hover:text-[#15191a]">Home</Link>
          <span aria-hidden> / </span>
          <span className="text-[#15191a]">NEET PG Counselling {EXAM_YEAR}</span>
        </nav>

        {/* Hero */}
        <div className="max-w-[720px]">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#e8f1ef] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            <span className="text-[12px] font-medium text-[#0b544e]">Updated for {EXAM_YEAR} cycle</span>
          </div>
          <h1 className="text-[44px] font-normal leading-[1.07] tracking-[-0.028em] text-[#15191a]">
            NEET PG Counselling {EXAM_YEAR} — Complete Guide
          </h1>
          <p className="mt-5 text-[17px] leading-[1.6] text-[#4e5654]">
            Everything you need to know about MCC AIQ counselling, state quota seats, round schedules,
            and how to build a realistic college shortlist before the official result — from the score you already have.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/predictor"
              className="rounded-[9px] bg-primary px-[24px] py-[13px] text-[15px] font-medium text-white transition-opacity hover:opacity-90"
            >
              Predict my colleges now
            </Link>
            <Link
              href="/neet-pg-cutoffs"
              className="rounded-[9px] border border-black/[0.14] bg-white px-[22px] py-[12px] text-[15px] font-medium text-[#15191a] hover:bg-[#faf9f6] transition-colors"
            >
              View {LATEST_CUTOFF_YEAR} cutoffs
            </Link>
          </div>
        </div>

        {/* Quick-stat bar */}
        <div className="mt-12 grid grid-cols-2 gap-4 rounded-[14px] border border-black/[0.08] bg-[#faf9f6] p-6 sm:grid-cols-4">
          {[
            { label: 'AIQ seats', value: '~50%', sub: 'of govt PG seats' },
            { label: 'Counselling rounds', value: '3', sub: 'R1 · R2 · Stray vacancy' },
            { label: 'Participating colleges', value: '300+', sub: 'govt, central & deemed' },
            { label: 'Authority', value: 'MCC', sub: 'mcc.nic.in' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-1">
              <span className="text-[12px] text-[#6b7472]">{s.label}</span>
              <span className="text-[26px] leading-none tabular-nums text-[#15191a]">{s.value}</span>
              <span className="text-[12px] text-[#6b7472]">{s.sub}</span>
            </div>
          ))}
        </div>

        {/* AIQ vs State quota */}
        <section className="mt-16" aria-labelledby="aiq-vs-state">
          <h2 id="aiq-vs-state" className="text-[30px] font-normal leading-[1.1] tracking-[-0.022em] text-[#15191a]">
            AIQ vs State quota — what's the difference?
          </h2>
          <p className="mt-4 max-w-[68ch] text-[16px] leading-relaxed text-[#4e5654]">
            NEET PG seats are split into two pools. Getting this distinction right is the most
            important piece of counselling strategy.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {[
              {
                tag: 'All India Quota (AIQ)',
                color: 'bg-[#e8f1ef] text-[#0b544e]',
                border: 'border-[#0b544e]/20',
                points: [
                  '50% of govt PG seats + all central + all deemed seats',
                  'Conducted by MCC on mcc.nic.in',
                  'Open to candidates from any state',
                  '3 rounds: R1, R2, Stray Vacancy',
                  'Security deposit refundable on joining',
                ],
              },
              {
                tag: 'State Quota',
                color: 'bg-[#fdf3e3] text-[#a07520]',
                border: 'border-amber-200',
                points: [
                  '50% of govt seats in each state',
                  'Conducted by state authorities separately',
                  'Usually restricted to state domicile holders',
                  'Schedule and rounds vary by state',
                  'Category reservations follow state rules',
                ],
              },
            ].map((col) => (
              <div key={col.tag} className={`rounded-[12px] border ${col.border} bg-white p-5`}>
                <span className={`inline-block rounded-full px-3 py-1 text-[12px] font-medium ${col.color} mb-4`}>
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
        </section>

        {/* Step-by-step process */}
        <section className="mt-16" aria-labelledby="process">
          <h2 id="process" className="text-[30px] font-normal leading-[1.1] tracking-[-0.022em] text-[#15191a]">
            MCC counselling process — step by step
          </h2>
          <div className="mt-7 space-y-4">
            {steps.map((step) => (
              <div
                key={step.num}
                className="flex gap-5 rounded-[12px] border border-black/[0.08] bg-white p-5"
              >
                <span className="text-[28px] font-normal leading-none tabular-nums text-[#d0ccc4] shrink-0 pt-0.5">
                  {step.num}
                </span>
                <div>
                  <p className="font-medium text-[#15191a]">{step.title}</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-[#4e5654]">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA — predictor */}
        <section
          className="mt-16 rounded-[16px] border border-black/[0.08] bg-[#faf9f6] p-8"
          aria-labelledby="predictor-cta"
        >
          <h2 id="predictor-cta" className="text-[26px] font-normal tracking-[-0.02em] text-[#15191a]">
            Know your college list before results are declared
          </h2>
          <p className="mt-3 max-w-[58ch] text-[15px] leading-relaxed text-[#4e5654]">
            Enter your expected NEET PG {EXAM_YEAR} score right now. The predictor estimates your rank range
            and matches it against {LATEST_CUTOFF_YEAR} closing ranks — across AIQ and state quota — to show
            you realistic MD/MS options for your category before the official result.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/predictor"
              className="rounded-[9px] bg-primary px-[24px] py-[13px] text-[15px] font-medium text-white transition-opacity hover:opacity-90"
            >
              Start free prediction
            </Link>
            <Link
              href="/neet-pg-cutoffs"
              className="rounded-[9px] border border-black/[0.14] bg-white px-[22px] py-[12px] text-[15px] font-medium text-[#15191a] hover:bg-white/60 transition-colors"
            >
              Browse {LATEST_CUTOFF_YEAR} cutoffs
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-[30px] font-normal leading-[1.1] tracking-[-0.022em] text-[#15191a]">
            Frequently asked questions
          </h2>
          <div className="mt-6 flex flex-col gap-3 max-w-3xl">
            {counsellingFaqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-[11px] border border-black/[0.08] bg-white px-5 py-4 shadow-[0_1px_3px_rgba(21,25,26,.04)]"
              >
                <summary className="cursor-pointer list-none marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    <span className="text-[14px] font-medium leading-snug text-[#15191a]">{f.q}</span>
                    <span className="shrink-0 text-[#6b7472] transition-transform group-open:rotate-45" aria-hidden>+</span>
                  </span>
                </summary>
                <p className="mt-3 text-[13.5px] leading-relaxed text-[#4e5654]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Internal links */}
        <section className="mt-16" aria-labelledby="related">
          <h2 id="related" className="text-[22px] font-normal tracking-[-0.02em] text-[#15191a]">
            Related resources on {siteConfig.brand}
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: '/', label: `NEET PG ${EXAM_YEAR} Rank Predictor`, sub: 'Free rank estimate from your expected score' },
              { href: '/neet-pg-cutoffs', label: `NEET PG ${LATEST_CUTOFF_YEAR} Cutoffs`, sub: 'College and branch-wise closing ranks' },
              { href: '/sample-report', label: 'Sample Counselling Report', sub: 'See what a full report looks like' },
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
