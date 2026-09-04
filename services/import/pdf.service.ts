import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

export class PdfToolMissingError extends Error {
  constructor() {
    super(
      'pdftoppm is not installed. It ships with poppler:\n' +
        '  macOS:  brew install poppler\n' +
        '  Debian: apt-get install poppler-utils',
    );
    this.name = 'PdfToolMissingError';
  }
}

/**
 * 150 DPI. Counselling PDFs are dense tables in small type; below ~120 DPI the
 * rank digits start to blur, and above ~200 the images get large enough that
 * vision cost rises without the read getting better.
 */
const RENDER_DPI = 150;

export async function assertPdfToolAvailable(): Promise<void> {
  try {
    await run('pdftoppm', ['-v']);
  } catch {
    throw new PdfToolMissingError();
  }
}

export async function pdfPageCount(filePath: string): Promise<number> {
  try {
    const { stdout } = await run('pdfinfo', [filePath]);
    const match = stdout.match(/^Pages:\s+(\d+)$/m);
    return match ? Number(match[1]) : 0;
  } catch {
    // pdfinfo is optional; the renderer reports the true count anyway.
    return 0;
  }
}

export interface RenderedPage {
  pageNumber: number;
  /** PNG bytes, base64 — the shape the vision API wants. */
  base64: string;
}

/**
 * Rasterises a page range to PNG using poppler.
 *
 * Deliberately shells out rather than pulling in a JS PDF renderer: poppler is
 * far more reliable on the malformed, scanned and mixed-encoding PDFs that
 * counselling authorities actually publish, and it adds no npm dependency.
 */
export async function renderPdfPages(
  filePath: string,
  options: { firstPage?: number; lastPage?: number } = {},
): Promise<RenderedPage[]> {
  await assertPdfToolAvailable();

  const workDir = await mkdtemp(path.join(tmpdir(), 'nextpg-pdf-'));
  try {
    const args = ['-png', '-r', String(RENDER_DPI)];
    if (options.firstPage) args.push('-f', String(options.firstPage));
    if (options.lastPage) args.push('-l', String(options.lastPage));
    args.push(filePath, path.join(workDir, 'page'));

    await run('pdftoppm', args, { maxBuffer: 1024 * 1024 * 64 });

    const files = (await readdir(workDir)).filter((f) => f.endsWith('.png')).sort();

    return Promise.all(
      files.map(async (file) => {
        // pdftoppm names output page-01.png, page-02.png … — the suffix is the
        // real page number, which matters when rendering a mid-document range.
        const parsed = Number(file.match(/-(\d+)\.png$/)?.[1] ?? 0);
        const buffer = await readFile(path.join(workDir, file));
        return { pageNumber: parsed, base64: buffer.toString('base64') };
      }),
    );
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

export async function hashFile(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  return createHash('sha256').update(buffer).digest('hex');
}
