'use client';

import { signOut } from 'next-auth/react';

/**
 * Defaults suit the sidebar dropdown it was written for; the blocked-account
 * page overrides className to render it as a standalone button.
 */
export function SignOutButton({
  children,
  className = 'w-full text-left',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <button type="button" onClick={() => signOut({ callbackUrl: '/' })} className={className}>
      {children ?? 'Sign out'}
    </button>
  );
}
