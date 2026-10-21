/**
 * Single source for the FAQ. Exported because the landing page emits FAQPage
 * JSON-LD from it: Google requires the marked-up answer to be the answer
 * actually visible on the page, so these must never be maintained twice.
 */
export const faqs = [
  {
    q: 'How accurate is the rank prediction?',
    a: 'The estimate is built from published score-to-rank data and last year\'s closing ranks. We always show a range and a confidence score rather than a single number, because the actual rank depends on the full candidate cohort, which nobody can know in advance.',
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
    a: 'MCC (Medical Counselling Committee) conducts NEET PG counselling for All India Quota (AIQ) seats — 50% of government PG seats, all central university seats, and all deemed university seats. It typically runs 3 rounds: Round 1, Round 2, and a Stray Vacancy Round. Candidates register, pay a security deposit, fill choices, and are allotted seats based on NEET PG merit. State quota seats (the other 50%) are filled by respective state counselling authorities separately.',
  },
  {
    q: 'What is the difference between AIQ and state quota in NEET PG?',
    a: 'All India Quota (AIQ) is 50% of seats in government medical colleges, filled by MCC based on national NEET PG merit — open to candidates from any state. State quota is the remaining 50%, filled by the state\'s own counselling authority — usually restricted to candidates with domicile in that state. Deemed university seats and central institute seats fall entirely under AIQ.',
  },
  {
    q: 'When does NEET PG 2026 counselling start?',
    a: 'MCC typically announces NEET PG counselling dates after NEET PG results are declared, usually 4–6 weeks after the exam. The schedule is published on mcc.nic.in. Round 1 registration generally opens within 6–8 weeks of the result. NextPG updates its predictor data each counselling cycle.',
  },
  {
    q: 'What is stray vacancy round in NEET PG counselling?',
    a: 'The Stray Vacancy Round (also called Round 3 or Mop-Up round) is the final round of MCC counselling where seats left unfilled after Rounds 1 and 2 are offered again. Candidates who were not allotted seats or who are fresh to counselling can participate. Seats are usually filled at slightly lower closing ranks than earlier rounds.',
  },
  {
    q: 'Can I predict my NEET PG college before results are declared?',
    a: 'Yes. NextPG lets you enter your expected score immediately after the exam to get an estimated rank range and a shortlist of colleges you are likely eligible for — split by AIQ and state quota. This helps you research and shortlist colleges before the official result.',
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
    a: 'The NEET PG score-to-rank relationship is not linear — it depends on the total number of candidates, the difficulty of the exam, and the distribution of scores in that particular year. A score of 400 might correspond to a rank of 20,000 in one year and 25,000 in the next. NextPG uses historical score–rank data to model this relationship and always presents the result as a range with a stated confidence level.',
  },
  {
    q: 'Which states have separate NEET PG counselling?',
    a: 'Most states conduct their own counselling for state quota seats. Major ones include: Telangana (KNRUHS), Andhra Pradesh (Dr. NTR UHS), Tamil Nadu (MRB / TNPG), Karnataka (KEA), Maharashtra (DMER), Delhi (DGHS), Rajasthan (RUHS), UP (UPUMS), and others. Each has its own registration window, eligibility rules, and closing ranks that may differ significantly from AIQ cutoffs.',
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
