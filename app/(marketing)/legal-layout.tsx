import { auth } from '@/auth';
import { MarketingHeader } from '@/features/landing/components/marketing-header';
import { MarketingFooter } from '@/features/landing/components/marketing-footer';

/**
 * Shared chrome + prose styling for the legal pages. Not a route layout —
 * these pages sit inside (marketing) alongside the landing page, which brings
 * its own header.
 */
export async function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <>
      <MarketingHeader isLoggedIn={Boolean(session?.user)} />
      <main id="main" className="mx-auto w-full max-w-3xl px-5 py-12 lg:py-16">
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p>

        <div
          className="mt-8 space-y-6 text-[15px] leading-relaxed text-muted-foreground
            [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground
            [&_li]:ml-1 [&_strong]:font-semibold [&_strong]:text-foreground
            [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5"
        >
          {children}
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
