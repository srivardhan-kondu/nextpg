'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/shared/logo';

const links = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '/sample-report', label: 'Sample report' },
  { href: '#pricing', label: 'Pricing' },
];

export function MarketingHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.08] bg-white">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-10">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-[30px] md:flex" aria-label="Primary">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[13.5px] leading-none text-[#4e5654] transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="text-[13.5px] leading-none text-[#4e5654] transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-[13.5px] leading-none text-[#4e5654] transition-colors hover:text-foreground"
            >
              Log in
            </Link>
          )}
          <Link
            href="/predictor"
            className="rounded-[8px] bg-primary px-[18px] py-[10px] text-[13.5px] font-medium leading-none text-white transition-opacity hover:opacity-90"
          >
            Start prediction
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="flex items-center justify-center rounded-md p-2 text-[#4e5654] md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-black/[0.08] bg-white px-6 py-3 md:hidden" aria-label="Mobile">
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
          {isLoggedIn ? (
            <Link href="/dashboard" onClick={() => setOpen(false)} className="block py-2.5 text-sm text-[#4e5654]">Dashboard</Link>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)} className="block py-2.5 text-sm text-[#4e5654]">Log in</Link>
          )}
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
