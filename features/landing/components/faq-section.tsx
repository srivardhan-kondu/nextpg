import { EXAM_FACTS, SCHEDULE, formatDay, formatLong } from '@/lib/content/counselling';
import { RANKED_CANDIDATES, SCORE_RANK_YEAR, officialRankRange } from '@/services/prediction/scoring';

/** "500 marks was rank 11,828–12,111" — read from the official table, never typed. */
function marksVsRank(score: number): string {
  const r = officialRankRange(score);
  if (!r) return `${score} marks had no candidates`;
  const fmt = (n: number) => n.toLocaleString('en-IN');
  return r.best === r.worst
    ? `${score} marks was rank ${fmt(r.best)}`
    : `${score} marks was rank ${fmt(r.best)}–${fmt(r.worst)}`;
}

/**
 * Single source for the FAQ. Exported because the landing page emits FAQPage
 * JSON-LD from it: Google requires the marked-up answer to be the answer
 * actually visible on the page, so these must never be maintained twice.
 * Counselling dates come from lib/content/counselling.ts, never typed here.
 */
export const faqs = [
  {
    q: 'How accurate is the rank prediction?',
    a: `Your rank comes straight from NBEMS's official NEET PG ${SCORE_RANK_YEAR} result, which lists the score and rank of all ${RANKED_CANDIDATES.toLocaleString('en-IN')} ranked candidates — so for a given score it matches the real rank. College chances are less certain, because closing ranks move from year to year, so we show a range and a confidence score rather than a single verdict.`,
  },
  {
    q: 'What does one credit get me?',
    a: 'One credit unlocks one complete report: rank analysis, branch and college recommendations, AIQ and state quota opportunities, dream branch and dream college validation, counseling strategy, and a downloadable PDF.',
  },
  {
    q: 'Do my credits or reports expire?',
    a: 'No. Credits do not expire, and every report you have unlocked stays in your account permanently. Re-opening or re-downloading an old report never costs a credit.',
  },
  {
    q: 'Where does your cutoff data come from?',
    a: 'Closing ranks come from published MCC and state counseling results. Every college shown in your report is backed by a stored cutoff record — we never invent data. Where we lack data for your category, we say so instead of guessing.',
  },
  {
    q: 'Can I use this for both AIQ and state quota counseling?',
    a: 'Yes. Your report separates all-India quota opportunities from state quota opportunities based on your domicile state, category, and sub-category eligibility.',
  },
  {
    q: 'How does MCC PG counselling work in 2026?',
    a: 'MCC (the Medical Counselling Committee) fills the 50% All India Quota of government PG seats, 100% of deemed university seats, all DNB seats, and the seats of central universities and institutes such as DU, BHU and AMU. It runs four online rounds: Round 1, Round 2, Round 3 and a Stray Vacancy Round. In each round you register, pay the fee and security deposit, fill and lock choices, and are allotted a seat by NEET PG rank and choice order. State quota seats are filled separately by each state\'s counselling authority.',
  },
  {
    q: 'What is the difference between AIQ and state quota in NEET PG?',
    a: 'All India Quota (AIQ) is 50% of the PG seats in government medical colleges, filled by MCC on national NEET PG merit and open to candidates from every state. State quota is the remaining 50%, filled by that state\'s own counselling authority and usually limited to candidates with the state\'s domicile. Deemed university and DNB seats are not split this way: MCC fills all of them.',
  },
  {
    q: 'When does NEET PG 2026 counselling start?',
    a: `NBEMS declared NEET PG 2026 results on ${formatLong(EXAM_FACTS.resultDate)}. MCC Round 1 registration opened on ${formatDay(SCHEDULE[0].registration[0])} and closes on ${formatDay(SCHEDULE[0].registration[1])}, with the Round 1 seat allotment result due on ${formatDay(SCHEDULE[0].result)}. Round 2 registration opens on ${formatDay(SCHEDULE[1].registration[0])}, Round 3 on ${formatDay(SCHEDULE[2].registration[0])} and the stray vacancy round on ${formatDay(SCHEDULE[3].registration[0])}. These dates are MCC's tentative schedule, so confirm them on mcc.nic.in.`,
  },
  {
    q: 'What is stray vacancy round in NEET PG counselling?',
    a: 'The stray vacancy round is the fourth and final MCC round, held after Round 3 to fill seats that are still empty. It is a separate round, not another name for Round 3. Candidates who did not register in Rounds 1–3 can join it, as can registered candidates who were not allotted a seat earlier. A stray vacancy seat must be joined; not joining forfeits the security deposit.',
  },
  {
    q: 'Can I check which colleges my NEET PG 2026 score can get?',
    a: 'Yes. Enter your NEET PG 2026 score and profile to get an estimated rank range and a shortlist of MD/MS colleges and branches you are likely eligible for, split by AIQ and state quota and matched against last year\'s closing ranks. Use it to plan your choice list before choice locking closes.',
  },
  {
    q: 'Does this tool work for INI-CET and AIIMS PG counselling?',
    a: 'The predictor is built around the NEET PG exam and MCC / state counselling data. INI-CET (for AIIMS, JIPMER, PGIMER, NIMHANS) is a separate exam with its own cutoffs. If you appeared for NEET PG alongside INI-CET, the college list here covers the NEET PG counselling route only.',
  },
  {
    q: 'How are college recommendations sorted in the report?',
    a: 'Colleges are grouped into three bands based on how your estimated rank compares to last year\'s closing rank: Strong (your rank is comfortably within the cutoff), Moderate (your rank is close to the cutoff), and Stretch (the cutoff is tighter than your rank but worth noting). Within each band, colleges are sorted by the probability score, which accounts for your specific quota, category and sub-category.',
  },
  {
    q: 'What is the NEET PG marks vs rank relationship?',
    a: `It is not linear, and it changes every year with the paper and the number of candidates. NEET PG ${SCORE_RANK_YEAR} had 180 questions for 720 marks. In the official result, ${marksVsRank(560)}, ${marksVsRank(500)}, ${marksVsRank(450)} and ${marksVsRank(400)}. NextPG uses the official result table for every score.`,
  },
  {
    q: 'Which states have separate NEET PG counselling?',
    a: 'Almost every state runs its own counselling for state quota seats. For example: Telangana (KNRUHS), Andhra Pradesh (Dr. NTR UHS), Tamil Nadu (Selection Committee, DME), Karnataka (KEA), Maharashtra (State CET Cell), Kerala (CEE), Uttar Pradesh (DGME), Rajasthan (RUHS), Gujarat (Admission Committee for Professional Medical Courses) and West Bengal (WBMCC). Each has its own registration window, domicile rules and closing ranks. In Delhi, MCC fills the institutional quota of DU and the IP University-affiliated central institutes alongside AIQ.',
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="border-b border-black/[0.08] bg-[#faf9f6] py-[66px]">
      <div className="mx-auto max-w-[1440px] px-10">
        <h2 className="m-0 mb-9 text-[28px] font-normal leading-[1.15] tracking-[-0.02em] text-[#15191a]">
          Frequently asked questions
        </h2>

        <div className="flex flex-col gap-3 max-w-3xl">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-[11px] border border-black/[0.08] bg-white px-5 py-4 shadow-[0_1px_3px_rgba(21,25,26,.04)]"
            >
              <summary className="cursor-pointer list-none marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  <span className="text-[14px] font-medium leading-snug text-[#15191a]">{f.q}</span>
                  <span className="shrink-0 text-[#6b7472] transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-[13.5px] leading-relaxed text-[#4e5654]">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
