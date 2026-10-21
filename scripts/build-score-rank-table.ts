/**
 * Build the official score → rank table from NBEMS's published NEET PG result.
 *
 *   pdftotext -layout "NEET-PG 2026 Published Result.pdf" result.txt
 *   npx tsx scripts/build-score-rank-table.ts result.txt --year 2026 --max-score 720 \
 *     --source "https://natboard.edu.in/pdoof/NEET-PG%202026%20Published%20Result_DS.pdf"
 *
 * The result lists every candidate's total score and rank. Only those two
 * columns are read; roll numbers and application ids are never kept. For each
 * score the output records the best and worst rank any candidate with that
 * score received — ties are broken by NBEMS's tie-break rules, so a score maps
 * to a narrow rank range, not a single rank.
 *
 * Writes services/prediction/data/score-rank-<year>.ts. Re-run each year when
 * NBEMS publishes the result, then point scoring.ts at the new file.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const input = process.argv[2];
const year = Number(flag('year'));
const maxScore = Number(flag('max-score'));
const source = flag('source');

if (!input || input.startsWith('--') || !year || !maxScore || !source) {
  console.error('Usage: npx tsx scripts/build-score-rank-table.ts <result.txt> --year <n> --max-score <n> --source <url>');
  process.exit(1);
}

// "  12   PG26014254   26661000012   263   132683" → score 263, rank 132683.
// ABSENT / WITHHELD rows have no numeric score and are skipped.
const ROW = /^\s*\d+\s+PG\d+\s+\d+\s+(-?\d+)\s+(\d+)\s*$/;

const byScore = new Map<number, { best: number; worst: number }>();
let ranked = 0;
let worstRank = 0;

for (const line of readFileSync(input, 'utf8').split('\n')) {
  const m = ROW.exec(line);
  if (!m) continue;
  const score = Number(m[1]);
  const rank = Number(m[2]);
  ranked++;
  worstRank = Math.max(worstRank, rank);
  const entry = byScore.get(score);
  if (entry) {
    entry.best = Math.min(entry.best, rank);
    entry.worst = Math.max(entry.worst, rank);
  } else {
    byScore.set(score, { best: rank, worst: rank });
  }
}

if (ranked < 1000) {
  console.error(`Only ${ranked} ranked rows found — is this the right file?`);
  process.exit(1);
}

const rows = [...byScore.entries()].sort((a, b) => b[0] - a[0]);

// A higher score must always rank ahead of every lower score.
for (let i = 1; i < rows.length; i++) {
  const [higher, h] = rows[i - 1]!;
  const [lower, l] = rows[i]!;
  if (h.worst >= l.best) {
    console.error(`Score ${higher} (worst rank ${h.worst}) overlaps score ${lower} (best rank ${l.best}).`);
    process.exit(1);
  }
}

const body = rows
  .map(([s, r]) => `[${s}, ${r.best}, ${r.worst}]`)
  .reduce<string[]>((lines, entry, i) => {
    if (i % 6 === 0) lines.push(entry);
    else lines[lines.length - 1] += `, ${entry}`;
    return lines;
  }, [])
  .map((l) => `    ${l},`)
  .join('\n');

const out = `/**
 * NEET PG ${year} official score → rank table. GENERATED — do not edit by hand.
 *
 * Built by scripts/build-score-rank-table.ts from NBEMS's published result:
 * ${source}
 *
 * ${ranked.toLocaleString('en-IN')} ranked candidates. Each row is [score, best rank, worst rank]:
 * every candidate with that score was ranked within that range (ties are
 * broken by NBEMS's tie-break rules). Rows are in descending score order, and
 * only scores at least one candidate achieved are listed.
 */
export const SCORE_RANK_${year} = {
  year: ${year},
  maxScore: ${maxScore},
  rankedCandidates: ${worstRank},
  source: ${JSON.stringify(source)},
  rows: [
${body}
  ] as ReadonlyArray<readonly [score: number, bestRank: number, worstRank: number]>,
} as const;
`;

const target = path.resolve(__dirname, `../services/prediction/data/score-rank-${year}.ts`);
writeFileSync(target, out);
console.log(`Wrote ${rows.length} scores (${rows[rows.length - 1]![0]}..${rows[0]![0]}) from ${ranked} ranked candidates → ${path.relative(process.cwd(), target)}`);
