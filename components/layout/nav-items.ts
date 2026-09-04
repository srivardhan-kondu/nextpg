import {
  BarChart3, CreditCard, FileText, LayoutDashboard, Sparkles, Target, User,
  Building2, GitBranch, ScrollText, Users, Wallet, Shield,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

/** Sidebar order matches the design reference exactly. */
export const appNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/predictor', label: 'Rank & College Predictor', icon: Target },
  { href: '/dream-validator', label: 'Dream Validator', icon: Sparkles },
  { href: '/reports', label: 'My Reports', icon: FileText },
  { href: '/credits', label: 'Buy Credits', icon: CreditCard },
  { href: '/profile', label: 'Profile', icon: User },
];

export const adminNav: NavItem[] = [
  { href: '/admin', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/colleges', label: 'Colleges', icon: Building2 },
  { href: '/admin/branches', label: 'Branches', icon: GitBranch },
  { href: '/admin/cutoffs', label: 'Historical Cutoffs', icon: ScrollText },
  { href: '/admin/quota-rules', label: 'Quota Rules', icon: Shield },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/payments', label: 'Payments', icon: Wallet },
  { href: '/admin/reports', label: 'Reports', icon: FileText },
];
