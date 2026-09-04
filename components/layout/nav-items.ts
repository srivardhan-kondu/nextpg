/**
 * Navigation config — plain data only.
 *
 * `icon` is a string key rather than a Lucide component because this array is
 * built in a Server Component (app-sidebar) and handed to a Client Component
 * (sidebar-nav). React cannot serialise a function across that boundary, and
 * doing so throws at render time while still returning HTTP 200 — so the whole
 * authenticated app breaks while looking healthy to any status-code check.
 *
 * The key is resolved to a real icon inside sidebar-nav, on the client.
 */
export type NavIcon =
  | 'dashboard'
  | 'target'
  | 'sparkles'
  | 'file-text'
  | 'credit-card'
  | 'user'
  | 'bar-chart'
  | 'building'
  | 'git-branch'
  | 'scroll'
  | 'shield'
  | 'users'
  | 'wallet'
  | 'upload';

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
}

/** Sidebar order matches the design reference exactly. */
export const appNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/predictor', label: 'Rank & College Predictor', icon: 'target' },
  { href: '/dream-validator', label: 'Dream Validator', icon: 'sparkles' },
  { href: '/reports', label: 'My Reports', icon: 'file-text' },
  { href: '/credits', label: 'Buy Credits', icon: 'credit-card' },
  { href: '/profile', label: 'Profile', icon: 'user' },
];

export const adminNav: NavItem[] = [
  { href: '/admin', label: 'Analytics', icon: 'bar-chart' },
  { href: '/admin/colleges', label: 'Colleges', icon: 'building' },
  { href: '/admin/branches', label: 'Branches', icon: 'git-branch' },
  { href: '/admin/cutoffs', label: 'Historical Cutoffs', icon: 'scroll' },
  { href: '/admin/quota-rules', label: 'Quota Rules', icon: 'shield' },
  { href: '/admin/users', label: 'Users', icon: 'users' },
  { href: '/admin/payments', label: 'Payments', icon: 'wallet' },
  { href: '/admin/reports', label: 'Reports', icon: 'file-text' },
  { href: '/admin/import', label: 'Bulk Import', icon: 'upload' },
];
