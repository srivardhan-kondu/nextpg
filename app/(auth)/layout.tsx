import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/shared/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="hero-gradient flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-5 py-5 lg:px-8">
        <Logo href="/" />
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
