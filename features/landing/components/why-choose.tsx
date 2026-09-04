/** Trust strip — 4-stat row matching design doc 1a trust strip */
const stats = [
  { value: '1,840+', label: 'Colleges tracked' },
  { value: '20', label: 'Branches validated' },
  { value: '4 yrs', label: 'Closing-rank history' },
  { value: 'AIQ + 28', label: 'State quota rule sets' },
];

export function WhyChoose({ brand: _ }: { brand: string }) {
  return (
    <section className="border-b border-black/[0.08] bg-white">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-6 px-10 py-[26px] sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-[5px]">
            <span className="text-[22px] leading-none tabular-nums text-[#15191a]">{s.value}</span>
            <span className="text-[12.5px] leading-none text-[#6b7472]">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
