/**
 * Ingest a counselling PDF into the review queue.
 *
 *   npm run extract:pdf -- ./mcc-2024-r1.pdf --year 2024 --source "MCC 2024 R1" [options]
 *
 *   --year <n>       academic year the document reports on   (required)
 *   --source <text>  provenance label, stored on every row   (required)
 *   --quota <QUOTA>  fallback when a page omits the column   (optional)
 *   --round <n>      fallback when a page omits the column   (optional)
 *   --pages a-b      restrict to a page range — use this to trial a big file
 *
 * Runs here rather than in a request because vision extraction is slow and
 * billed per page: a 200-page MCC file would blow past any serverless timeout.
 * Nothing it writes reaches historical_cutoffs; rows land in the review queue.
 */
import { PrismaClient, type QuotaType } from '@prisma/client';
import { ingestPdf, DuplicateDocumentError } from '../services/import/extraction.service';
import { assertPdfToolAvailable, PdfToolMissingError } from '../services/import/pdf.service';
import { REVIEW_THRESHOLD } from '../services/import/validation.service';

const prisma = new PrismaClient();

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main() {
  const filePath = process.argv[2];
  const year = Number(flag('year'));
  const source = flag('source');

  if (!filePath || filePath.startsWith('--') || !year || !source) {
    console.error(
      'Usage: npm run extract:pdf -- <file.pdf> --year <n> --source "<label>"\n' +
        '       [--quota AIQ] [--round 1] [--pages 1-20]',
    );
    process.exit(1);
  }

  await assertPdfToolAvailable();

  const range = flag('pages')?.split('-').map(Number);
  const [firstPage, lastPage] = range ?? [];

  console.log(`Ingesting ${filePath}`);
  console.log(`  source: ${source} · year: ${year}${range ? ` · pages ${firstPage}-${lastPage}` : ''}\n`);

  const job = await ingestPdf({
    filePath,
    sourceLabel: source,
    academicYear: year,
    defaultQuota: (flag('quota') as QuotaType | undefined) ?? null,
    defaultRound: flag('round') ? Number(flag('round')) : null,
    firstPage,
    lastPage,
    onProgress: ({ page, of, rows }) =>
      process.stdout.write(`\r  page ${page}/${of} — ${rows} rows`),
  });

  const clean = job.totalRows - job.flaggedRows;
  const cost = (job.promptTokens / 1000) * 0.0025 + (job.completionTokens / 1000) * 0.01;

  console.log(`\n\nExtracted ${job.totalRows} rows across ${job.pageCount} pages`);
  console.log(`  ${clean} clean (confidence >= ${REVIEW_THRESHOLD}, fully matched)`);
  console.log(`  ${job.flaggedRows} flagged for review`);
  console.log(`  ~$${cost.toFixed(2)} in OpenAI usage`);
  console.log(`\nNothing has entered historical_cutoffs yet.`);
  console.log(`Review and approve at /admin/import/${job.id}`);
}

main()
  .catch((error) => {
    if (error instanceof PdfToolMissingError) {
      console.error(`\n${error.message}`);
    } else if (error instanceof DuplicateDocumentError) {
      console.error(`\nThis PDF was already ingested. Review it at /admin/import/${error.jobId}`);
    } else {
      console.error('\nExtraction failed:', error);
    }
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
