/**
 * Load an MCC-derived dataset (colleges.csv, branches.csv, cutoffs.csv) and,
 * optionally, retire the generated seed cutoffs it replaces.
 *
 *   npx tsx scripts/import-mcc-dataset.ts data/mcc-2025-r1              # dry run: reads only
 *   npx tsx scripts/import-mcc-dataset.ts data/mcc-2025-r1 --apply      # write
 *   npx tsx scripts/import-mcc-dataset.ts data/mcc-2025-r1 --apply --retire-seed
 *
 * Without --apply nothing is written; the script reports what it would do.
 *
 * Order matters so the live site always has data to serve: courses and
 * colleges first, then cutoffs, and only then (with --retire-seed) the seed
 * rows are deleted and seed-only colleges/courses deactivated. Deactivated,
 * not deleted: past dream validations still reference them. Every step is
 * idempotent, so a failed run can simply be repeated.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient, type Category, type CollegeType, type QuotaType } from '@prisma/client';
import { parseCsvTable } from '../lib/csv';

const prisma = new PrismaClient();
const BATCH = 1000;
const SEED_SOURCE_PREFIX = 'Seed (representative)';

const dir = process.argv[2];
const apply = process.argv.includes('--apply');
const retireSeed = process.argv.includes('--retire-seed');

/** Pre- and para-clinical subjects: no direct patient care. */
const NON_CLINICAL = /Anatomy|Physiology|Biochemistry|Pathology|Microbiology|Pharmacology|Forensic|Community Medicine|Public Health|Epidemiology|Hospital Administration|Laboratory Medicine|Bacteriology|Transfusion/i;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

function uniqueSlug(base: string, taken: Set<string>): string {
  let slug = base || 'item';
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  taken.add(slug);
  return slug;
}

function read(file: string) {
  return parseCsvTable(readFileSync(path.join(dir!, file), 'utf8')).rows;
}

async function main() {
  if (!dir) {
    console.error('Usage: npx tsx scripts/import-mcc-dataset.ts <dataset-dir> [--apply] [--retire-seed]');
    process.exit(1);
  }
  const collegeRows = read('colleges.csv');
  const branchRows = read('branches.csv');
  const cutoffRows = read('cutoffs.csv');
  console.log(`Dataset: ${collegeRows.length} colleges, ${branchRows.length} courses, ${cutoffRows.length} cutoffs`);
  console.log(apply ? 'Mode: APPLY (writing)\n' : 'Mode: dry run (nothing will be written)\n');

  // ── courses ──────────────────────────────────────────────────────────────
  const existingBranches = await prisma.branch.findMany({ select: { id: true, name: true, slug: true } });
  const branchByName = new Map(existingBranches.map((b) => [b.name.toLowerCase(), b.id]));
  const branchSlugs = new Set(existingBranches.map((b) => b.slug));
  const newBranches = branchRows.filter((b) => !branchByName.has(b.name!.toLowerCase()));
  console.log(`Courses: ${branchRows.length - newBranches.length} already exist, ${newBranches.length} to create`);
  if (apply && newBranches.length) {
    await prisma.branch.createMany({
      data: newBranches.map((b) => ({
        name: b.name!,
        slug: uniqueSlug(slugify(b.name!), branchSlugs),
        degree: b.degree!,
        popularity: Number(b.popularity) || 0,
        isClinical: !NON_CLINICAL.test(b.specialty ?? b.name!),
        isActive: true,
      })),
      skipDuplicates: true,
    });
  }

  // ── colleges ─────────────────────────────────────────────────────────────
  const existingColleges = await prisma.college.findMany({ select: { id: true, name: true, slug: true } });
  const collegeByName = new Map(existingColleges.map((c) => [c.name.toLowerCase(), c.id]));
  const collegeSlugs = new Set(existingColleges.map((c) => c.slug));
  const newColleges = collegeRows.filter((c) => !collegeByName.has(c.name!.toLowerCase()));
  const reused = collegeRows.length - newColleges.length;
  console.log(`Colleges: ${reused} already exist (kept, re-activated), ${newColleges.length} to create`);
  if (apply) {
    if (newColleges.length) {
      for (let i = 0; i < newColleges.length; i += BATCH) {
        await prisma.college.createMany({
          data: newColleges.slice(i, i + BATCH).map((c) => ({
            name: c.name!,
            slug: uniqueSlug(slugify(c.name!), collegeSlugs),
            state: c.state!,
            type: c.type as CollegeType,
            isActive: true,
          })),
          skipDuplicates: true,
        });
      }
    }
    if (reused) {
      await prisma.college.updateMany({
        where: { name: { in: collegeRows.map((c) => c.name!), mode: 'insensitive' } },
        data: { isActive: true },
      });
    }
  }

  // ── cutoffs ──────────────────────────────────────────────────────────────
  const [colleges, branches] = apply
    ? await Promise.all([
        prisma.college.findMany({ select: { id: true, name: true, state: true } }),
        prisma.branch.findMany({ select: { id: true, name: true } }),
      ])
    : [existingColleges.map((c) => ({ ...c, state: '' })), existingBranches];
  const cId = new Map(colleges.map((c) => [c.name.toLowerCase(), c]));
  const bId = new Map(branches.map((b) => [b.name.toLowerCase(), b.id]));
  const now = new Date();

  const payload = [];
  let unmatched = 0;
  for (const r of cutoffRows) {
    const college = cId.get(r.college_name!.toLowerCase());
    const branchId = bId.get(r.branch_name!.toLowerCase());
    if (!college || !branchId) {
      unmatched++;
      continue;
    }
    payload.push({
      collegeId: college.id,
      branchId,
      quota: r.quota as QuotaType,
      category: r.category as Category,
      subCategory: 'NONE' as const,
      closingRank: Number(r.closing_rank),
      openingRank: r.opening_rank ? Number(r.opening_rank) : null,
      seatCount: Number(r.seat_count) || 0,
      round: Number(r.round),
      academicYear: Number(r.academic_year),
      state: college.state,
      source: r.source!,
      verifiedAt: now,
    });
  }
  if (apply) {
    if (unmatched) throw new Error(`${unmatched} cutoff rows did not match a college or course — aborting before any cutoff is written.`);
    let written = 0;
    for (let i = 0; i < payload.length; i += BATCH) {
      const res = await prisma.historicalCutoff.createMany({ data: payload.slice(i, i + BATCH), skipDuplicates: true });
      written += res.count;
      process.stdout.write(`\r  cutoffs ${Math.min(i + BATCH, payload.length)}/${payload.length}`);
    }
    console.log(`\nCutoffs: inserted ${written} (${payload.length - written} already present)`);
  } else {
    console.log(`Cutoffs: ${cutoffRows.length} to insert (matched after courses/colleges are created)`);
  }

  // ── retire the generated seed data ───────────────────────────────────────
  const seedRows = await prisma.historicalCutoff.count({ where: { source: { startsWith: SEED_SOURCE_PREFIX } } });
  const seedOnlyColleges = await prisma.college.count({
    where: {
      isActive: true,
      cutoffs: { some: { source: { startsWith: SEED_SOURCE_PREFIX } }, none: { NOT: { source: { startsWith: SEED_SOURCE_PREFIX } } } },
      name: { notIn: collegeRows.map((c) => c.name!), mode: 'insensitive' },
    },
  });
  const seedOnlyBranches = await prisma.branch.count({
    where: {
      isActive: true,
      cutoffs: { some: { source: { startsWith: SEED_SOURCE_PREFIX } }, none: { NOT: { source: { startsWith: SEED_SOURCE_PREFIX } } } },
      name: { notIn: branchRows.map((b) => b.name!), mode: 'insensitive' },
    },
  });
  console.log(`Seed data: ${seedRows} generated cutoff rows; ${seedOnlyColleges} seed-only colleges and ${seedOnlyBranches} seed-only courses`);

  if (apply && retireSeed) {
    const realRows = await prisma.historicalCutoff.count({ where: { NOT: { source: { startsWith: SEED_SOURCE_PREFIX } } } });
    if (realRows < 1000) throw new Error(`Only ${realRows} real cutoff rows present — refusing to remove the seed data.`);
    // Deactivate first (needs the seed rows to identify seed-only records), then delete.
    const cols = await prisma.college.updateMany({
      where: { cutoffs: { none: { NOT: { source: { startsWith: SEED_SOURCE_PREFIX } } } } },
      data: { isActive: false },
    });
    const brs = await prisma.branch.updateMany({
      where: { cutoffs: { none: { NOT: { source: { startsWith: SEED_SOURCE_PREFIX } } } } },
      data: { isActive: false },
    });
    const del = await prisma.historicalCutoff.deleteMany({ where: { source: { startsWith: SEED_SOURCE_PREFIX } } });
    console.log(`Retired seed data: deleted ${del.count} rows, deactivated ${cols.count} colleges and ${brs.count} courses`);
  } else if (retireSeed) {
    console.log('(--retire-seed would delete those rows and deactivate those colleges/courses)');
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
