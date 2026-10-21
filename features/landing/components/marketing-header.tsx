'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/shared/logo';

/**
 * Root-relative hrefs throughout: a bare `#pricing` only works on the homepage
 * and silently breaks on every other page that renders this header.
 *
 * The counselling guide and cutoff hub sit in the primary nav because they are
 * the pages built to rank — a site-wide link is the strongest internal signal
 * a page can get.
 */
const links = [
  { href: '/neet-pg-counselling', label: 'Counselling 2026' },
  { href: '/neet-pg-cutoffs', label: 'Cutoffs' },
  { href: '/sample-report', label: 'Sample report' },
  { href: '/#pricing', label: 'Pricing' },
];

/**
 * Login state is read on the client so the marketing pages can be statically
 * rendered and served from the CDN — calling `auth()` on the server would make
 * every one of them dynamic. `isLoggedIn` lets a server page that already knows
 * the answer avoid a flash of the signed-out nav.
 */
export function MarketingHeader({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const { status } = useSession();
  const loggedIn = status === 'authenticated' || (status === 'loading' && isLoggedIn);

  const accountLink = loggedIn
    ? { href: '/dashboard', label: 'Dashboard' }
    : { href: '/login', label: 'Log in' };

  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.08] bg-white">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-[26px] lg:flex" aria-label="Primary">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[13.5px] leading-none text-[#4e5654] transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={accountLink.href}
            className="text-[13.5px] leading-none text-[#4e5654] transition-colors hover:text-foreground"
          >
            {accountLink.label}
          </Link>
          <Link
            href="/predictor"
            className="rounded-[8px] bg-primary px-[18px] py-[10px] text-[13.5px] font-medium leading-none text-white transition-opacity hover:opacity-90"
          >
            Start prediction
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="flex items-center justify-center rounded-md p-2 text-[#4e5654] lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-black/[0.08] bg-white px-5 py-3 lg:hidden" aria-label="Mobile">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 text-sm text-[#4e5654] hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={accountLink.href}
            onClick={() => setOpen(false)}
            className="block py-2.5 text-sm text-[#4e5654] hover:text-foreground"
          >
            {accountLink.label}
          </Link>
          <Link
            href="/predictor"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-[8px] bg-primary px-4 py-2.5 text-center text-sm font-medium text-white"
          >
            Start prediction
          </Link>
        </nav>
      )}
    </header>
  );
}
