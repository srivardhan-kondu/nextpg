import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, BadgeCheck, Ban, CreditCard, Eye,
  GraduationCap, Mail, MapPin, Smartphone, User2,
} from 'lucide-react';

import { requireAdmin } from '@/lib/auth/guards';
import { userRepository } from '@/repositories/user.repository';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { StatTile } from '@/components/shared/stat-tile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate, formatDateTime, formatRankRange } from '@/lib/utils';
import { readPayload } from '@/repositories/prediction.repository';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await userRepository.byId(id);
  if (!user) return { title: 'User not found' };
  return { title: `${user.name ?? user.email} | Admin` };
}

const PAYMENT_STATUS_BADGE = {
  PAID: 'strong',
  CREATED: 'secondary',
  ATTEMPTED: 'moderate',
  FAILED: 'destructive',
  REFUNDED: 'soft',
} as const;

const PREDICTION_STATUS_BADGE = {
  UNLOCKED: 'strong',
  PREVIEW: 'secondary',
} as const;

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const user = await userRepository.byIdWithDetails(id);
  if (!user) notFound();

  const totalSpentPaise = user.payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3 text-muted-foreground">
          <Link href="/admin/users">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
        <PageHeader
          title={user.name ?? user.email}
          description={`Joined ${formatDate(user.createdAt)} · ID: ${user.id}`}
        />
      </div>

      {/* Account info + quick stats */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Info card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User2 className="h-4 w-4 text-primary" aria-hidden />
              Account details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="break-all">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Smartphone className="h-3.5 w-3.5 shrink-0" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.defaultState && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{user.defaultState}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant={user.role === 'SUPER_ADMIN' ? 'default' : user.role === 'ADMIN' ? 'soft' : 'secondary'}>
                {user.role.replace('_', ' ').toLowerCase()}
              </Badge>
              {user.isBlocked ? (
                <Badge variant="destructive" className="gap-1">
                  <Ban className="h-3 w-3" /> Blocked
                </Badge>
              ) : (
                <Badge variant="strong" className="gap-1">
                  <BadgeCheck className="h-3 w-3" /> Active
                </Badge>
              )}
              {user.defaultCategory && (
                <Badge variant="secondary">{user.defaultCategory}</Badge>
              )}
              {user.gender && (
                <Badge variant="secondary">{user.gender.toLowerCase()}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-3 content-start">
          <StatTile label="Credit balance" value={user.credit?.balance ?? 0} tone="primary" hint="available to spend" />
          <StatTile label="Credits used" value={user.credit?.used ?? 0} />
          <StatTile label="Credits purchased" value={user.credit?.purchased ?? 0} />
          <StatTile label="Predictions" value={user._count.predictions} tone={user._count.predictions > 0 ? 'strong' : 'default'} />
          <StatTile label="Dream validations" value={user._count.dreamValidations} />
          <StatTile label="Total spent" value={formatCurrency(totalSpentPaise)} tone={totalSpentPaise > 0 ? 'strong' : 'default'} />
        </div>
      </div>

      {/* ── Predictions ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4 text-primary" aria-hidden />
            Predictions
            <Badge variant="secondary" className="ml-auto text-xs">
              {user._count.predictions}
            </Badge>
          </CardTitle>
          <CardDescription>
            All rank &amp; college predictions this student has run, newest first.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>State · Category</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Rank range</TableHead>
                  <TableHead className="text-right">Colleges</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Top colleges</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.predictions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      This student has not run any predictions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  user.predictions.map((pred) => {
                    const result = readPayload(pred.resultPayload);
                    const topColleges = [
                      ...(result.bands?.STRONG ?? []),
                      ...(result.bands?.MODERATE ?? []),
                    ].slice(0, 3);

                    return (
                      <TableRow key={pred.id} className="group align-top">
                        <TableCell className="font-medium">{pred.candidateName}</TableCell>
                        <TableCell>
                          <span className="text-sm">{pred.state}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {pred.category}
                            {pred.subCategory !== 'NONE' ? ` · ${pred.subCategory}` : ''}
                          </span>
                        </TableCell>
                        <TableCell className="tabular-nums">{pred.expectedScore}</TableCell>
                        <TableCell className="font-mono text-sm tabular-nums">
                          {formatRankRange(pred.rankMin, pred.rankMax)}
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {pred.confidence}% conf.
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {pred.totalOpportunities}
                        </TableCell>
                        <TableCell>
                          <Badge variant={PREDICTION_STATUS_BADGE[pred.status]} className="text-xs">
                            {pred.status.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-[200px]">
                          {topColleges.length > 0 ? (
                            <ul className="space-y-1">
                              {topColleges.map((c, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs">
                                  <span
                                    className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                      c.band === 'STRONG'
                                        ? 'bg-green-500'
                                        : c.band === 'MODERATE'
                                        ? 'bg-amber-500'
                                        : 'bg-blue-400'
                                    }`}
                                  />
                                  <span className="text-foreground leading-tight">{c.collegeName}</span>
                                </li>
                              ))}
                              {pred.totalOpportunities > 3 && (
                                <li className="text-xs text-muted-foreground pl-3">
                                  +{pred.totalOpportunities - 3} more…
                                </li>
                              )}
                            </ul>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(pred.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            asChild
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 opacity-60 group-hover:opacity-100 transition-opacity"
                          >
                            <Link
                              href={`/admin/predictions/${pred.id}`}
                              aria-label="View full college list"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Payments ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-primary" aria-hidden />
            Payments
            <Badge variant="secondary" className="ml-auto text-xs">
              {user._count.payments}
            </Badge>
          </CardTitle>
          <CardDescription>All Razorpay payment orders for this user.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid at</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      No payments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  user.payments.map((pay) => (
                    <TableRow key={pay.id}>
                      <TableCell className="tabular-nums font-semibold">
                        {formatCurrency(pay.amount)}
                      </TableCell>
                      <TableCell className="tabular-nums">{pay.creditsSold}</TableCell>
                      <TableCell className="text-sm text-muted-foreground capitalize">
                        {pay.method ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={PAYMENT_STATUS_BADGE[pay.status]} className="text-xs">
                          {pay.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {pay.paidAt ? formatDateTime(pay.paidAt) : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(pay.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
