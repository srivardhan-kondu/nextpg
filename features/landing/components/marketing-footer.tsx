import Link from 'next/link';
import { Logo } from '@/components/shared/logo';
import { siteConfig } from '@/config/site';

export function MarketingFooter() {
  return (
    <footer className="border-t border-black/[0.08] bg-white py-12">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-[#6b7472]">
            {siteConfig.tagline}
          </p>
          <p className="mt-3 max-w-sm text-[12px] leading-relaxed text-[#6b7472]">
            {siteConfig.brand} is an independent planning tool. It is not affiliated with the NBEMS,
            MCC, or any state counseling authority.
          </p>
        </div>

        <div>
          <h3 className="text-[13px] font-semibold text-[#15191a]">Product</h3>
          <ul className="mt-3 flex flex-col gap-2 text-[13px] text-[#6b7472]">
            <li><Link href="/predictor" className="hover:text-[#15191a]">Rank Predictor</Link></li>
            <li><Link href="/dream-validator" className="hover:text-[#15191a]">Dream Validator</Link></li>
            <li><Link href="/sample-report" className="hover:text-[#15191a]">Sample Report</Link></li>
            <li><Link href="/credits" className="hover:text-[#15191a]">Pricing</Link></li>
            {/* The cutoff hub is the entry point crawlers follow into every
                generated college and branch page — it needs a site-wide link,
                not only the one from the landing page. */}
            <li><Link href="/neet-pg-cutoffs" className="hover:text-[#15191a]">NEET PG Cutoffs</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-[13px] font-semibold text-[#15191a]">Legal</h3>
          <ul className="mt-3 flex flex-col gap-2 text-[13px] text-[#6b7472]">
            <li><Link href="/terms" className="hover:text-[#15191a]">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-[#15191a]">Privacy Policy</Link></li>
            <li><Link href="/refund-policy" className="hover:text-[#15191a]">Refund Policy</Link></li>
            <li><Link href="/support" className="hover:text-[#15191a]">Support</Link></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-[1440px] border-t border-black/[0.08] px-10 pt-6">
        <p className="text-[12px] text-[#6b7472]">
          © {new Date().getFullYear()} {siteConfig.brand}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
