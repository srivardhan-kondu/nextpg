import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Building2, CheckCircle2, GraduationCap, Info,
  MapPin, Star, TrendingDown, TrendingUp, User2,
} from 'lucide-react';

import { requireAdmin } from '@/lib/auth/guards';
import { predictionRepository, readPayload } from '@/repositories/prediction.repository';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatTile } from '@/components/shared/stat-tile';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatDate, formatRankRange } from '@/lib/utils';
import type { CollegeOpportunity } from '@/types/prediction';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const prediction = await predictionRepository.adminById(id);
  if (!prediction) return { title: 'Not found' };
  return { title: `Prediction: ${prediction.candidateName} | Admin` };
}

const BAND_CONFIG = {
  STRONG: { label: 'Strong', icon: CheckCircle2, badgeVariant: 'strong' as const, color: 'text-green-600' },
  MODERATE: { label: 'Moderate', icon: TrendingUp, badgeVariant: 'moderate' as const, color: 'text-amber-600' },
  STRETCH: { label: 'Stretch', icon: TrendingDown, badgeVariant: 'soft' as const, color: 'text-blue-600' },
} as const;

const COLLEGE_TYPE_BADGE = {
  GOVERNMENT: 'strong',
  PRIVATE: 'secondary',
  DEEMED: 'soft',
  DNB: 'moderate',
} as const;

function CollegeTable({ colleges }: { colleges: CollegeOpportunity[] }) {
  if (colleges.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No colleges in this band.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>College</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quota</TableHead>
            <TableHead className="text-right">Closing rank</TableHead>
            <TableHead className="text-right">Probability</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {colleges.map((opp, idx) => (
            <TableRow key={`${opp.collegeId}-${opp.branchId}-${opp.quota}-${idx}`}>
              <TableCell>
                <span className="font-medium text-foreground">{opp.collegeName}</span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{opp.branchName}</TableCell>
              <TableCell className="text-sm">{opp.state}</TableCell>
              <TableCell>
                <Badge variant={COLLEGE_TYPE_BADGE[opp.collegeType]} className="text-xs">
                  {opp.collegeType.toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{opp.quota}</TableCell>
              <TableCell className="text-right tabular-nums font-mono text-sm">
                {opp.closingRank.toLocaleString('en-IN')}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={`font-semibold tabular-nums text-sm ${
                    opp.probability >= 70
                      ? 'text-green-600'
                      : opp.probability >= 40
                      ? 'text-amber-600'
                      : 'text-red-500'
                  }`}
                >
                  {opp.probability}%
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default async function AdminPredictionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const prediction = await predictionRepository.adminById(id);
  if (!prediction) notFound();

  const result = readPayload(prediction.resultPayload);
  const allColleges: CollegeOpportunity[] = [
    ...(result.bands?.STRONG ?? []),
    ...(result.bands?.MODERATE ?? []),
    ...(result.bands?.STRETCH ?? []),
  ];

  // Deduplicate by collegeId for a summary view
  const uniqueColleges = Array.from(
    new Map(allColleges.map((c) => [c.collegeId, c])).values(),
  );

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3 text-muted-foreground">
          <Link href="/admin/predictions">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Predictions
          </Link>
        </Button>
        <PageHeader
          title={`${prediction.candidateName}'s Prediction`}
          description={`Run on ${formatDate(prediction.createdAt)} · Engine ${prediction.engineVersion}`}
        />
      </div>

      {/* Student info card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User2 className="h-4 w-4 text-primary" aria-hidden />
            Student Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Account</p>
              <p className="font-medium">{prediction.user.name ?? '—'}</p>
              <p className="text-muted-foreground text-xs">{prediction.user.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">State · Category</p>
              <p className="font-medium">{prediction.state}</p>
              <p className="text-muted-foreground text-xs">
                {prediction.category}
                {prediction.subCategory !== 'NONE' ? ` · ${prediction.subCategory}` : ''}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Score</p>
              <p className="font-semibold tabular-nums text-lg">{prediction.expectedScore}</p>
              <p className="text-muted-foreground text-xs">
                ✓ {prediction.correctAnswers} &nbsp;✗ {prediction.wrongAnswers} &nbsp;— {prediction.unattempted}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Status</p>
              <Badge variant={prediction.status === 'UNLOCKED' ? 'strong' : 'secondary'} className="mt-0.5">
                {prediction.status.toLowerCase()}
              </Badge>
              {prediction.unlockedAt && (
                <p className="text-muted-foreground text-xs mt-1">
                  Unlocked {formatDate(prediction.unlockedAt)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prediction overview stats */}
      <section aria-labelledby="pred-overview" className="space-y-3">
        <h2 id="pred-overview" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Prediction Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Rank range" value={formatRankRange(prediction.rankMin, prediction.rankMax)} />
          <StatTile label="Confidence" value={`${prediction.confidence}%`} tone={prediction.confidence >= 70 ? 'strong' : prediction.confidence >= 40 ? 'moderate' : 'stretch'} />
          <StatTile label="AIQ opportunities" value={prediction.aiqOpportunities} />
          <StatTile label="State opportunities" value={prediction.stateOpportunities} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label="Total colleges" value={prediction.totalOpportunities} tone="primary" />
          <StatTile label="Unique colleges" value={uniqueColleges.length} />
          <StatTile label="Preferred type" value={prediction.preferredType.replace('_', ' ')} />
        </div>
      </section>

      {/* College bands */}
      {(['STRONG', 'MODERATE', 'STRETCH'] as const).map((band) => {
        const cfg = BAND_CONFIG[band];
        const colleges = result.bands?.[band] ?? [];
        const Icon = cfg.icon;
        return (
          <Card key={band}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 text-base ${cfg.color}`}>
                <Icon className="h-4 w-4" aria-hidden />
                {cfg.label} colleges
                <Badge variant={cfg.badgeVariant} className="ml-auto text-xs">
                  {colleges.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                {band === 'STRONG'
                  ? 'Student rank is comfortably within historical closing ranks.'
                  : band === 'MODERATE'
                  ? 'Student rank is near the closing rank — admission is possible.'
                  : 'Closing rank is above student rank — a reach, but worth noting.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CollegeTable colleges={colleges} />
            </CardContent>
          </Card>
        );
      })}

      {/* Recommended colleges list */}
      {result.recommendedColleges && result.recommendedColleges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-amber-500" aria-hidden />
              Engine-recommended colleges
              <Badge variant="secondary" className="ml-auto text-xs">
                {result.recommendedColleges.length}
              </Badge>
            </CardTitle>
            <CardDescription>Top picks surfaced by the prediction engine.</CardDescription>
          </CardHeader>
          <CardContent>
            <CollegeTable colleges={result.recommendedColleges} />
          </CardContent>
        </Card>
      )}

      {/* Strategy notes */}
      {result.strategy && result.strategy.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4 text-primary" aria-hidden />
              Strategy notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.strategy.map((note, i) => (
                <li key={i} className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3">
                  <span
                    className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                      note.priority === 'high'
                        ? 'bg-red-500'
                        : note.priority === 'medium'
                        ? 'bg-amber-500'
                        : 'bg-blue-400'
                    }`}
                  />
                  <div>
                    <p className="font-medium text-sm">{note.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{note.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Dream validations */}
      {prediction.dreamValidations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-4 w-4 text-primary" aria-hidden />
              Dream validations
              <Badge variant="secondary" className="ml-auto text-xs">
                {prediction.dreamValidations.length}
              </Badge>
            </CardTitle>
            <CardDescription>Colleges and branches the student checked against this prediction.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {prediction.dreamValidations.map((dv) => (
                <div
                  key={dv.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/20 p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{dv.dreamBranch}</p>
                    {dv.dreamCollege && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {dv.dreamCollege}
                      </p>
                    )}
                    {dv.studentRankMin != null && dv.studentRankMax != null && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Student rank {formatRankRange(dv.studentRankMin, dv.studentRankMax)}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {dv.branchLikelihood && (
                      <Badge
                        variant={
                          dv.branchLikelihood === 'STRONG'
                            ? 'strong'
                            : dv.branchLikelihood === 'MODERATE'
                            ? 'moderate'
                            : dv.branchLikelihood === 'STRETCH'
                            ? 'soft'
                            : 'destructive'
                        }
                        className="text-xs"
                      >
                        {dv.branchLikelihood.replace('_', ' ').toLowerCase()}
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(dv.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
