/** "Three steps, stop guessing" section — matches design doc 1a how-it-works block */
const steps = [
  {
    step: 'STEP 01',
    title: 'Tell us your attempt',
    body: 'Correct and wrong counts, or an expected score. State, category and sub-category do the rest.',
  },
  {
    step: 'STEP 02',
    title: 'See your honest range',
    body: 'A rank band with a confidence score — never a fake single number — plus what opens up in AIQ and your state.',
  },
  {
    step: 'STEP 03',
    title: 'Test your dream',
    body: 'Check a branch and a college against your band, then take the PDF into your counselling planning.',
  },
];

export function FeatureCards() {
  return (
    <section id="how-it-works" className="border-b border-black/[0.08] bg-white py-[66px]">
      <div className="mx-auto max-w-[1440px] px-10">
        {/* Section header */}
        <div className="mb-[34px] flex max-w-[52ch] flex-col gap-2.5">
          <h2 className="m-0 text-[32px] font-normal leading-[1.15] tracking-[-0.02em] text-[#15191a]">
            Three steps, and you stop guessing
          </h2>
          <p className="m-0 text-[15.5px] leading-[1.55] text-[#4e5654]">
            You already know roughly how the paper went. That&apos;s enough to start planning properly.
          </p>
        </div>

        {/* 3-column step cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.step}
              className="flex flex-col gap-[11px] rounded-[11px] border border-black/[0.07] bg-[#faf9f6] p-[26px]"
            >
              <span className="text-[11.5px] font-medium leading-none tracking-[.1em] text-primary">
                {s.step}
              </span>
              <span className="text-[17px] font-medium leading-[1.3] text-[#15191a]">{s.title}</span>
              <p className="m-0 text-[14px] leading-[1.55] text-[#4e5654]">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
