/**
 * Seeds reference data: branches, a starter college set, quota rules and a
 * representative cutoff matrix.
 *
 * Idempotent — safe to re-run. The cutoff figures here are *representative*,
 * not published data; replace them with a real MCC/state import before launch
 * (see scripts/import-cutoffs.ts and /admin/import).
 */
import { PrismaClient, type Category, type CollegeType, type QuotaType } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

const ACADEMIC_YEAR = 2024;

const BRANCHES = [
  { name: 'Radiology', code: 'MD-RD', degree: 'MD', isClinical: true, popularity: 98 },
  { name: 'Dermatology', code: 'MD-DVL', degree: 'MD', isClinical: true, popularity: 97 },
  { name: 'General Medicine', code: 'MD-GM', degree: 'MD', isClinical: true, popularity: 96 },
  { name: 'Pediatrics', code: 'MD-PED', degree: 'MD', isClinical: true, popularity: 92 },
  { name: 'General Surgery', code: 'MS-GS', degree: 'MS', isClinical: true, popularity: 90 },
  { name: 'Orthopedics', code: 'MS-ORTH', degree: 'MS', isClinical: true, popularity: 88 },
  { name: 'Psychiatry', code: 'MD-PSY', degree: 'MD', isClinical: true, popularity: 80 },
  { name: 'Anaesthesia', code: 'MD-ANAE', degree: 'MD', isClinical: true, popularity: 78 },
  { name: 'Emergency Medicine', code: 'MD-EM', degree: 'MD', isClinical: true, popularity: 74 },
  { name: 'Ophthalmology', code: 'MS-OPH', degree: 'MS', isClinical: true, popularity: 72 },
  { name: 'ENT', code: 'MS-ENT', degree: 'MS', isClinical: true, popularity: 70 },
  { name: 'Respiratory Medicine', code: 'MD-RESP', degree: 'MD', isClinical: true, popularity: 60 },
  { name: 'Pathology', code: 'MD-PATH', degree: 'MD', isClinical: false, popularity: 58 },
  { name: 'Family Medicine', code: 'MD-FM', degree: 'MD', isClinical: true, popularity: 52 },
  { name: 'Community Medicine', code: 'MD-CM', degree: 'MD', isClinical: false, popularity: 45 },
  { name: 'Microbiology', code: 'MD-MICRO', degree: 'MD', isClinical: false, popularity: 38 },
  { name: 'Pharmacology', code: 'MD-PHARM', degree: 'MD', isClinical: false, popularity: 34 },
  { name: 'Biochemistry', code: 'MD-BIOCHEM', degree: 'MD', isClinical: false, popularity: 26 },
  { name: 'Physiology', code: 'MD-PHYSIO', degree: 'MD', isClinical: false, popularity: 22 },
  { name: 'Anatomy', code: 'MD-ANAT', degree: 'MD', isClinical: false, popularity: 18 },
];

const COLLEGES: {
  name: string;
  shortName: string;
  state: string;
  city: string;
  type: CollegeType;
  tags?: string[];
  /** Institutional prestige, 1 (most competitive) → 10. Shapes seeded cutoffs. */
  tier: number;
}[] = [
  { name: 'All India Institute of Medical Sciences Delhi', shortName: 'AIIMS Delhi', state: 'Delhi', city: 'New Delhi', type: 'GOVERNMENT', tags: ['AIIMS', 'INI'], tier: 1 },
  { name: 'Postgraduate Institute of Medical Education and Research', shortName: 'PGIMER', state: 'Chandigarh', city: 'Chandigarh', type: 'GOVERNMENT', tags: ['INI'], tier: 1 },
  { name: 'Jawaharlal Institute of Postgraduate Medical Education and Research', shortName: 'JIPMER', state: 'Puducherry', city: 'Puducherry', type: 'GOVERNMENT', tags: ['INI'], tier: 1 },
  { name: 'Maulana Azad Medical College', shortName: 'MAMC', state: 'Delhi', city: 'New Delhi', type: 'GOVERNMENT', tier: 2 },
  { name: 'Lady Hardinge Medical College', shortName: 'LHMC', state: 'Delhi', city: 'New Delhi', type: 'GOVERNMENT', tier: 2 },
  { name: 'Seth GS Medical College', shortName: 'KEM Mumbai', state: 'Maharashtra', city: 'Mumbai', type: 'GOVERNMENT', tier: 2 },
  { name: 'Grant Government Medical College', shortName: 'GGMC', state: 'Maharashtra', city: 'Mumbai', type: 'GOVERNMENT', tier: 3 },
  { name: 'Government Medical College, Nagpur', shortName: 'GMC Nagpur', state: 'Maharashtra', city: 'Nagpur', type: 'GOVERNMENT', tier: 4 },
  { name: 'Osmania Medical College', shortName: 'OMC', state: 'Telangana', city: 'Hyderabad', type: 'GOVERNMENT', tier: 3 },
  { name: 'Gandhi Medical College', shortName: 'GMC Hyderabad', state: 'Telangana', city: 'Secunderabad', type: 'GOVERNMENT', tier: 4 },
  { name: 'Kakatiya Medical College', shortName: 'KMC Warangal', state: 'Telangana', city: 'Warangal', type: 'GOVERNMENT', tier: 5 },
  { name: 'Nizams Institute of Medical Sciences', shortName: 'NIMS', state: 'Telangana', city: 'Hyderabad', type: 'GOVERNMENT', tier: 2 },
  { name: 'Deccan College of Medical Sciences', shortName: 'DCMS', state: 'Telangana', city: 'Hyderabad', type: 'PRIVATE', tier: 7 },
  { name: 'Bangalore Medical College and Research Institute', shortName: 'BMCRI', state: 'Karnataka', city: 'Bengaluru', type: 'GOVERNMENT', tier: 3 },
  { name: 'Kasturba Medical College', shortName: 'KMC Manipal', state: 'Karnataka', city: 'Manipal', type: 'DEEMED', tier: 6 },
  { name: 'Madras Medical College', shortName: 'MMC', state: 'Tamil Nadu', city: 'Chennai', type: 'GOVERNMENT', tier: 3 },
  { name: 'Christian Medical College Vellore', shortName: 'CMC Vellore', state: 'Tamil Nadu', city: 'Vellore', type: 'PRIVATE', tier: 2 },
  { name: 'Sri Ramachandra Institute of Higher Education and Research', shortName: 'SRIHER', state: 'Tamil Nadu', city: 'Chennai', type: 'DEEMED', tier: 7 },
  { name: 'King George Medical University', shortName: 'KGMU', state: 'Uttar Pradesh', city: 'Lucknow', type: 'GOVERNMENT', tier: 3 },
  { name: 'Institute of Medical Sciences BHU', shortName: 'IMS BHU', state: 'Uttar Pradesh', city: 'Varanasi', type: 'GOVERNMENT', tier: 3 },
  { name: 'Government Medical College, Kozhikode', shortName: 'GMC Kozhikode', state: 'Kerala', city: 'Kozhikode', type: 'GOVERNMENT', tier: 4 },
  { name: 'Medical College Kolkata', shortName: 'MCK', state: 'West Bengal', city: 'Kolkata', type: 'GOVERNMENT', tier: 4 },
  { name: 'BJ Medical College', shortName: 'BJMC', state: 'Gujarat', city: 'Ahmedabad', type: 'GOVERNMENT', tier: 4 },
  { name: 'SMS Medical College', shortName: 'SMS', state: 'Rajasthan', city: 'Jaipur', type: 'GOVERNMENT', tier: 4 },
  { name: 'Gandhi Medical College Bhopal', shortName: 'GMC Bhopal', state: 'Madhya Pradesh', city: 'Bhopal', type: 'GOVERNMENT', tier: 5 },
  { name: 'Government Medical College, Patiala', shortName: 'GMC Patiala', state: 'Punjab', city: 'Patiala', type: 'GOVERNMENT', tier: 5 },
  { name: 'Deen Dayal Upadhyay Hospital DNB', shortName: 'DDU DNB', state: 'Delhi', city: 'New Delhi', type: 'DNB', tier: 8 },
  { name: 'Apollo Hospitals DNB Programme', shortName: 'Apollo DNB', state: 'Telangana', city: 'Hyderabad', type: 'DNB', tier: 8 },
];

/** Branch competitiveness, 1 (hardest) → 20. Mirrors lib/constants. */
const BRANCH_RANK: Record<string, number> = {
  Radiology: 1, Dermatology: 2, 'General Medicine': 3, Pediatrics: 4, 'General Surgery': 5,
  Orthopedics: 6, Psychiatry: 7, Anaesthesia: 8, 'Emergency Medicine': 9, Ophthalmology: 10,
  ENT: 11, 'Respiratory Medicine': 12, Pathology: 13, 'Family Medicine': 14,
  'Community Medicine': 15, Microbiology: 16, Pharmacology: 17, Biochemistry: 18,
  Physiology: 19, Anatomy: 20,
};

/** Category relaxation multipliers applied to the GENERAL closing rank. */
const CATEGORY_FACTOR: Record<Category, number> = {
  GENERAL: 1, EWS: 1.35, OBC: 1.6, SC: 3.2, ST: 4.4,
};

const QUOTA_FACTOR: Record<string, number> = {
  AIQ: 1, STATE: 1.9, DEEMED: 4.2, MANAGEMENT: 5.5, NRI: 7, INSTITUTIONAL: 2.4,
};

/**
 * Deterministic pseudo-cutoff. A closed-form model of "prestige × branch
 * competitiveness × category × quota" — realistic in shape so the UI and the
 * banding logic can be exercised end to end, and reproducible so seeding twice
 * gives identical numbers.
 */
function syntheticClosingRank(tier: number, branch: string, category: Category, quota: QuotaType): number {
  const branchRank = BRANCH_RANK[branch] ?? 10;
  const base = 220 * Math.pow(tier, 1.75) * Math.pow(branchRank, 1.45);
  const adjusted = base * CATEGORY_FACTOR[category] * (QUOTA_FACTOR[quota] ?? 1);
  // Stable jitter from the inputs so the grid does not look machine-generated.
  const jitter = 1 + ((tier * 7 + branchRank * 13) % 11) / 100;
  return Math.max(1, Math.round(adjusted * jitter));
}

async function seedBranches() {
  for (const branch of BRANCHES) {
    await prisma.branch.upsert({
      where: { name: branch.name },
      update: { ...branch, slug: slugify(branch.name), isActive: true },
      create: { ...branch, slug: slugify(branch.name), isActive: true },
    });
  }
  console.log(`✓ ${BRANCHES.length} branches`);
}

async function seedColleges() {
  for (const college of COLLEGES) {
    const slug = slugify(`${college.name}-${college.state}`);
    const { tier: _tier, ...data } = college;
    await prisma.college.upsert({
      where: { slug },
      update: { ...data, slug, isActive: true },
      create: { ...data, slug, isActive: true },
    });
  }
  console.log(`✓ ${COLLEGES.length} colleges`);
}

async function seedQuotaRules() {
  const states = [...new Set(COLLEGES.map((c) => c.state))];

  for (const state of states) {
    // 50% AIQ / 50% state split for government PG seats.
    const rules = [
      { quota: 'AIQ' as QuotaType, requiresDomicile: false, seatSharePct: 50, notes: 'All India Quota — 50% of government PG seats, open to every state.' },
      { quota: 'STATE' as QuotaType, requiresDomicile: true, seatSharePct: 50, notes: `State quota — requires ${state} domicile.` },
      { quota: 'DEEMED' as QuotaType, requiresDomicile: false, seatSharePct: 100, notes: 'Deemed universities admit nationally; no domicile requirement.' },
    ];

    for (const rule of rules) {
      const existing = await prisma.quotaRule.findFirst({
        where: { state, quota: rule.quota, category: null, academicYear: ACADEMIC_YEAR },
        select: { id: true },
      });
      const data = { state, academicYear: ACADEMIC_YEAR, isActive: true, ...rule };
      if (existing) await prisma.quotaRule.update({ where: { id: existing.id }, data });
      else await prisma.quotaRule.create({ data });
    }
  }
  console.log(`✓ quota rules for ${states.length} states`);
}

async function seedCutoffs() {
  const colleges = await prisma.college.findMany({ select: { id: true, name: true, state: true, type: true } });
  const branches = await prisma.branch.findMany({ select: { id: true, name: true } });
  const tierByName = new Map(COLLEGES.map((c) => [c.name, c.tier]));

  const categories: Category[] = ['GENERAL', 'EWS', 'OBC', 'SC', 'ST'];
  const rows: {
    collegeId: string; branchId: string; quota: QuotaType; category: Category;
    closingRank: number; seatCount: number; round: number; academicYear: number;
    state: string; source: string;
  }[] = [];

  for (const college of colleges) {
    const tier = tierByName.get(college.name) ?? 6;

    // Which quotas this institution actually offers.
    const quotas: QuotaType[] =
      college.type === 'GOVERNMENT' ? ['AIQ', 'STATE']
      : college.type === 'DEEMED' ? ['DEEMED', 'NRI']
      : college.type === 'DNB' ? ['AIQ', 'INSTITUTIONAL']
      : ['STATE', 'MANAGEMENT'];

    for (const branch of branches) {
      for (const quota of quotas) {
        for (const category of categories) {
          rows.push({
            collegeId: college.id,
            branchId: branch.id,
            quota,
            category,
            closingRank: syntheticClosingRank(tier, branch.name, category, quota),
            seatCount: Math.max(1, 12 - Math.floor(tier * 0.9)),
            round: 1,
            academicYear: ACADEMIC_YEAR,
            state: college.state,
            source: `Seed (representative) ${ACADEMIC_YEAR}`,
          });
        }
      }
    }
  }

  // Wipe only seeded rows so a real import is never destroyed by re-seeding.
  await prisma.historicalCutoff.deleteMany({
    where: { academicYear: ACADEMIC_YEAR, source: { startsWith: 'Seed (representative)' } },
  });

  const CHUNK = 1000;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await prisma.historicalCutoff.createMany({ data: rows.slice(i, i + CHUNK), skipDuplicates: true });
  }
  console.log(`✓ ${rows.length} cutoff rows`);
}

async function main() {
  console.log('Seeding NextPG reference data…\n');
  await seedBranches();
  await seedColleges();
  await seedQuotaRules();
  await seedCutoffs();
  console.log('\nDone. Replace the seeded cutoffs with real data via /admin/import before launch.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
