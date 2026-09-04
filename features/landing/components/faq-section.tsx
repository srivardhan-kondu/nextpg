const faqs = [
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
