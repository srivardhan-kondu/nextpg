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
 * The only thing the session changes here is one nav link, and rendering its
 * signed-out form is harmless: middleware already redirects a signed-in user
 * from /login to /dashboard, so the link still lands them in the right place.
 */
export default function CutoffsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingHeader isLoggedIn={false} />
      <main id="main" className="mx-auto w-full max-w-5xl px-5 py-10 lg:py-14">{children}</main>
      <MarketingFooter />
    </>
  );
}
