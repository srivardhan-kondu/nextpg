import { MarketingHeader } from '@/features/landing/components/marketing-header';
import { MarketingFooter } from '@/features/landing/components/marketing-footer';

/**
 * Chrome for the public cutoff pages.
 *
 * Deliberately does NOT call `auth()`. Reading the session cookie opts the
 * whole subtree out of static rendering, and these pages exist to be crawled:
 * every Googlebot hit would otherwise cost a session lookup plus a cutoff query
 * before the first byte. Their content is identical for every visitor, so the
 * cost buys nothing.
 *
 * The only thing the session changes here is one nav link, and the header
 * resolves that on the client, so signed-in visitors still see "Dashboard".
 */
export default function CutoffsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingHeader />
      <main id="main" className="mx-auto w-full max-w-5xl px-5 py-10 lg:py-14">{children}</main>
      <MarketingFooter />
    </>
  );
}
