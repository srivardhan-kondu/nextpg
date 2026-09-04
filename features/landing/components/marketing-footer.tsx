import Link from 'next/link';
import { Logo } from '@/components/shared/logo';
import { siteConfig } from '@/config/site';

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="container grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{siteConfig.tagline}</p>
          <p className="mt-4 max-w-sm text-xs leading-relaxed text-muted-foreground">
            {siteConfig.brand} is an independent planning tool. It is not affiliated with the NBEMS, MCC,
            or any state counseling authority.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Product</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/predictor" className="hover:text-foreground">Rank Predictor</Link></li>
            <li><Link href="/dream-validator" className="hover:text-foreground">Dream Validator</Link></li>
            <li><Link href="/sample-report" className="hover:text-foreground">Sample Report</Link></li>
            <li><Link href="/credits" className="hover:text-foreground">Pricing</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Legal</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
            <li><Link href="/refund-policy" className="hover:text-foreground">Refund Policy</Link></li>
            <li><Link href="/support" className="hover:text-foreground">Support</Link></li>
          </ul>
        </div>
      </div>

      <div className="container mt-10 border-t border-border pt-6">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {siteConfig.brand}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
