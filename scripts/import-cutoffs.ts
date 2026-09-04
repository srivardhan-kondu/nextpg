/**
 * Bulk cutoff import from the command line — the path for large files that
 * would time out in a serverless request.
 *
 *   npm run import:cutoffs -- ./data/mcc-2024.csv
 *
 * Columns: college_name, branch_name, quota, category, sub_category,
 *          closing_rank, opening_rank, seat_count, round, academic_year, source
 *
 * Colleges and branches are matched by name and never auto-created: a typo must
 * surface as an error, not silently fragment the dataset.
 */
import { readFileSync } from 'node:fs';
import { PrismaClient, type Category, type QuotaType, type SubCategory } from '@prisma/client';
import { parseCsvTable } from '../lib/csv';

const prisma = new PrismaClient();
const BATCH = 500;

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error('Usage: npm run import:cutoffs -- ./data/cutoffs.csv');
    process.exit(1);
  }

  const { rows } = parseCsvTable(readFileSync(path, 'utf8'));
  console.log(`Parsed ${rows.length} rows from ${path}`);
  if (rows.length === 0) process.exit(0);

  const [colleges, branches] = await Promise.all([
    prisma.college.findMany({ select: { id: true, name: true, state: true } }),
    prisma.branch.findMany({ select: { id: true, name: true } }),
  ]);

  const collegeByName = new Map(colleges.map((c) => [c.name.toLowerCase(), c]));
  const branchByName = new Map(branches.map((b) => [b.name.toLowerCase(), b]));

  const unmatchedColleges = new Set<string>();
  const unmatchedBranches = new Set<string>();

  const payload: {
    collegeId: string; branchId: string; quota: QuotaType; category: Category;
    subCategory: SubCategory; closingRank: number; openingRank?: number; seatCount: number;
    round: number; academicYear: number; state: string; source?: string; verifiedAt: Date;
  }[] = [];

  for (const row of rows) {
    const college = collegeByName.get((row.college_name ?? '').toLowerCase());
    const branch = branchByName.get((row.branch_name ?? '').toLowerCase());

    if (!college) {
      unmatchedColleges.add(row.college_name ?? '(blank)');
      continue;
    }
    if (!branch) {
      unmatchedBranches.add(row.branch_name ?? '(blank)');
      continue;
    }

    const closingRank = Number(row.closing_rank);
    const academicYear = Number(row.academic_year);
    if (!Number.isFinite(closingRank) || !Number.isFinite(academicYear)) continue;

    payload.push({
      collegeId: college.id,
      branchId: branch.id,
      quota: (row.quota ?? 'AIQ').toUpperCase() as QuotaType,
      category: (row.category ?? 'GENERAL').toUpperCase() as Category,
      subCategory: ((row.sub_category || 'NONE').toUpperCase()) as SubCategory,
      closingRank,
      openingRank: row.opening_rank ? Number(row.opening_rank) : undefined,
      seatCount: Number(row.seat_count) || 0,
      round: Number(row.round) || 1,
      academicYear,
      state: college.state,
      source: row.source || undefined,
      verifiedAt: new Date(),
    });
  }

  console.log(`Matched ${payload.length} rows. Writing in batches of ${BATCH}…`);

  let written = 0;
  for (let i = 0; i < payload.length; i += BATCH) {
    const chunk = payload.slice(i, i + BATCH);
    // skipDuplicates keeps a re-run from failing on the composite unique key.
    const result = await prisma.historicalCutoff.createMany({ data: chunk, skipDuplicates: true });
    written += result.count;
    process.stdout.write(`\r  ${Math.min(i + BATCH, payload.length)}/${payload.length}`);
  }

  console.log(`\n✓ Inserted ${written} new rows (${payload.length - written} already existed).`);

  if (unmatchedColleges.size > 0) {
    console.warn(`\n⚠ ${unmatchedColleges.size} unmatched colleges:`);
    console.warn([...unmatchedColleges].slice(0, 25).map((n) => `   ${n}`).join('\n'));
  }
  if (unmatchedBranches.size > 0) {
    console.warn(`\n⚠ ${unmatchedBranches.size} unmatched branches:`);
    console.warn([...unmatchedBranches].slice(0, 25).map((n) => `   ${n}`).join('\n'));
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
