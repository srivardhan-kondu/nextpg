import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col" style={{ background: '#efeeea' }}>
      {/* Minimal top bar — no logo since the card has it */}
      <header className="flex items-center justify-end px-6 py-5">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-[13px] text-[#6b7472] transition-colors hover:text-[#15191a]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to home
        </Link>
      </header>

      <main id="main" className="flex flex-1 items-center justify-center px-5 py-10">
        {children}
      </main>
    </div>
  );
}
