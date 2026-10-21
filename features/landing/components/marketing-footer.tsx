import Link from 'next/link';
import { Logo } from '@/components/shared/logo';
import { siteConfig, EXAM_YEAR } from '@/config/site';

/**
 * The Resources column is the site-wide link into the pages built to rank:
 * crawlers follow it from every page into the counselling guide and the cutoff
 * hub (and from there into each generated college and branch page).
 */
const columns = [
  {
    heading: 'Product',
    links: [
      { href: '/predictor', label: 'Rank Predictor' },
      { href: '/dream-validator', label: 'Dream Validator' },
      { href: '/#pricing', label: 'Pricing' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { href: '/neet-pg-counselling', label: `NEET PG Counselling ${EXAM_YEAR}` },
      { href: '/neet-pg-cutoffs', label: 'NEET PG Cutoffs' },
      { href: '/sample-report', label: 'Sample Report' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '/terms', label: 'Terms of Service' },
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/refund-policy', label: 'Refund Policy' },
      { href: '/support', label: 'Support' },
    ],
  },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-black/[0.08] bg-white py-12">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 sm:grid-cols-3 lg:grid-cols-5 lg:px-10">
        <div className="sm:col-span-3 lg:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-[#6b7472]">
            {siteConfig.tagline}
          </p>
          <p className="mt-3 max-w-sm text-[12px] leading-relaxed text-[#6b7472]">
            {siteConfig.brand} is an independent planning tool. It is not affiliated with the NBEMS,
            MCC, or any state counselling authority.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.heading}>
            <h3 className="text-[13px] font-semibold text-[#15191a]">{col.heading}</h3>
            <ul className="mt-3 flex flex-col gap-2 text-[13px] text-[#6b7472]">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-[#15191a]">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-[1440px] border-t border-black/[0.08] px-5 pt-6 lg:px-10">
        <p className="text-[12px] text-[#6b7472]">
          © {new Date().getFullYear()} {siteConfig.brand}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
