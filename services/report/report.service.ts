import crypto from 'node:crypto';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import * as React from 'react';

import { prisma } from '@/lib/prisma';
import { ReportDocument } from '@/pdf/report-document';
import { siteConfig, PREDICTION_DISCLAIMER } from '@/config/site';
import { formatDateTime, slugify } from '@/lib/utils';
import type { PredictionResult } from '@/types/prediction';
import type { ReportData } from '@/types/report';

export class ReportLockedError extends Error {
  constructor() {
    super('This report has not been unlocked yet.');
    this.name = 'ReportLockedError';
  }
}

export class ReportNotFoundError extends Error {
  constructor() {
    super('Report not found.');
    this.name = 'ReportNotFoundError';
  }
}

/** How many rows of each opportunity table the PDF carries. */
const MAX_AIQ_ROWS = 25;
const MAX_STATE_ROWS = 25;
const MAX_COLLEGE_ROWS = 20;

/**
 * Assembles the PDF payload from stored rows only.
 *
 * The prediction's `resultPayload` is a snapshot taken at generation time, so a
 * later cutoff-data update never silently rewrites a report the user already paid
 * for.
 */
export async function buildReportData(params: {
  predictionId: string;
  userId: string;
  reportId?: string;
}): Promise<ReportData> {
  const prediction = await prisma.prediction.findFirst({
    where: { id: params.predictionId, userId: params.userId },
    include: {
      user: { select: { email: true } },
      dreamValidations: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!prediction) throw new ReportNotFoundError();
  if (prediction.status !== 'UNLOCKED') throw new ReportLockedError();

  const result = prediction.resultPayload as unknown as PredictionResult;
  const all = [...result.bands.STRONG, ...result.bands.MODERATE, ...result.bands.STRETCH];

  return {
    brand: siteConfig.brand,
    tagline: siteConfig.tagline,
    reportId: params.reportId ?? prediction.id,
    generatedAt: formatDateTime(new Date()),

    profile: {
      candidateName: prediction.candidateName,
      gender: prediction.gender,
      state: prediction.state,
      category: prediction.category,
      subCategory: prediction.subCategory,
      preferredType: prediction.preferredType,
      email: prediction.user.email,
    },

    exam: {
      correctAnswers: prediction.correctAnswers,
      wrongAnswers: prediction.wrongAnswers,
      unattempted: prediction.unattempted,
      expectedScore: prediction.expectedScore,
      examYear: prediction.examYear,
    },

    prediction: {
      rankMin: prediction.rankMin,
      rankMax: prediction.rankMax,
      confidence: prediction.confidence,
      percentile: prediction.percentile ?? result.percentile,
      aiqOpportunities: prediction.aiqOpportunities,
      stateOpportunities: prediction.stateOpportunities,
      totalOpportunities: prediction.totalOpportunities,
    },

    aiqOpportunities: all
      .filter((o) => o.quota === 'AIQ')
      .sort((a, b) => b.probability - a.probability)
      .slice(0, MAX_AIQ_ROWS),
    stateOpportunities: all
      .filter((o) => o.quota !== 'AIQ')
      .sort((a, b) => b.probability - a.probability)
      .slice(0, MAX_STATE_ROWS),

    recommendedBranches: result.recommendedBranches.slice(0, 10),
    recommendedColleges: result.recommendedColleges.slice(0, MAX_COLLEGE_ROWS),

    dreamValidations: prediction.dreamValidations.map((dream) => ({
      dreamBranch: dream.dreamBranch,
      branchProbability: dream.branchProbability,
      branchLikelihood: dream.branchLikelihood,
      branchMessage: dream.branchMessage,
      dreamCollege: dream.dreamCollege,
      collegeLikelihood: dream.collegeLikelihood,
      requiredRankMin: dream.requiredRankMin,
      requiredRankMax: dream.requiredRankMax,
      eligibleQuotas: dream.eligibleQuotas,
      availableBranches: dream.availableBranches,
      collegeMessage: dream.collegeMessage,
    })),

    strategy: result.strategy,
    notes: result.notes,
    disclaimer: PREDICTION_DISCLAIMER,
  };
}

export async function renderReportPdf(data: ReportData): Promise<Buffer> {
  // ReportDocument returns <Document>, but its own props are {data}, so the
  // element type does not structurally match renderToBuffer's DocumentProps
  // parameter. The cast asserts what the component actually renders.
  const element = React.createElement(ReportDocument, { data }) as React.ReactElement<DocumentProps>;
  return renderToBuffer(element);
}

/**
 * Returns the Report row for a prediction, creating it on first request.
 *
 * Reports are rendered on demand rather than stored as blobs: the source data is
 * already snapshotted on the prediction, so a re-render is deterministic and we
 * avoid paying for object storage. `storageKey` exists on the model for the day
 * that changes.
 */
export async function ensureReport(params: { predictionId: string; userId: string }) {
  const existing = await prisma.report.findFirst({
    where: { predictionId: params.predictionId, userId: params.userId },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) return existing;

  const prediction = await prisma.prediction.findFirst({
    where: { id: params.predictionId, userId: params.userId },
    select: { candidateName: true, state: true, examYear: true, status: true },
  });
  if (!prediction) throw new ReportNotFoundError();
  if (prediction.status !== 'UNLOCKED') throw new ReportLockedError();

  return prisma.report.create({
    data: {
      userId: params.userId,
      predictionId: params.predictionId,
      title: `PG Prediction Report — ${prediction.candidateName} (${prediction.examYear})`,
      status: 'READY',
      metadata: { state: prediction.state, examYear: prediction.examYear },
    },
  });
}

export async function recordDownload(reportId: string, checksum: string, fileSize: number) {
  await prisma.report.update({
    where: { id: reportId },
    data: {
      downloadCount: { increment: 1 },
      lastDownloadAt: new Date(),
      checksum,
      fileSize,
      status: 'READY',
    },
  });
}

export function checksumOf(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 32);
}

export function reportFileName(data: ReportData): string {
  return `${slugify(`${data.brand}-report-${data.profile.candidateName}`)}.pdf`;
}
