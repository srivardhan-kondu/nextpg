import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUserOrThrow, AuthorizationError } from '@/lib/auth/guards';
import { rateLimit } from '@/lib/security/rate-limit';
import { audit } from '@/lib/security/audit';
import {
  buildReportData,
  checksumOf,
  recordDownload,
  renderReportPdf,
  reportFileName,
  ReportLockedError,
  ReportNotFoundError,
} from '@/services/report/report.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// PDF rendering is CPU-bound; give it room beyond the default lambda timeout.
export const maxDuration = 60;

/**
 * Streams a report PDF. Re-downloading is always free — a credit was already
 * spent to unlock the underlying prediction, and the product promises permanent
 * access.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUserOrThrow();
    const { id } = await params;

    const verdict = await rateLimit('report', `user:${user.id}`);
    if (!verdict.success) {
      return NextResponse.json({ error: 'Too many downloads. Try again shortly.' }, { status: 429 });
    }

    // Scoped by userId — the report id alone is never sufficient authorization.
    const report = await prisma.report.findFirst({
      where: { id, userId: user.id },
      select: { id: true, predictionId: true },
    });
    if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });

    const data = await buildReportData({
      predictionId: report.predictionId,
      userId: user.id,
      reportId: report.id,
    });

    const pdf = await renderReportPdf(data);
    const checksum = checksumOf(pdf);

    await recordDownload(report.id, checksum, pdf.byteLength);
    await audit({
      userId: user.id,
      action: 'report.download',
      entityType: 'report',
      entityId: report.id,
    });

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${reportFileName(data)}"`,
        'Content-Length': String(pdf.byteLength),
        // Reports are personal: never let a shared cache hold one.
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }
    if (error instanceof ReportLockedError) {
      return NextResponse.json({ error: 'Unlock this report first.' }, { status: 402 });
    }
    if (error instanceof ReportNotFoundError) {
      return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
    }
    console.error('[report] download failed', error);
    return NextResponse.json({ error: 'Could not generate the report.' }, { status: 500 });
  }
}
