'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-left">
      {children}
    </button>
  );
}
