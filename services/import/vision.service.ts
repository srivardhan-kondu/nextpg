import { z } from 'zod';

export class VisionUnavailableError extends Error {
  constructor() {
    super('OPENAI_API_KEY is not configured.');
    this.name = 'VisionUnavailableError';
  }
}

export const PROMPT_VERSION = 'v1';

/**
 * The extraction contract.
 *
 * Every field is nullable on purpose. A model that cannot leave a cell empty
 * will fill it, and a plausible-looking invented rank is the single worst
 * failure this system can produce — it is indistinguishable from real data once
 * it reaches the prediction engine. Nullable fields plus an explicit
 * `unreadable` flag give the model somewhere honest to put uncertainty.
 */
const extractedRowSchema = z.object({
  rawText: z.string().max(600),
  collegeName: z.string().max(300).nullable(),
  branchName: z.string().max(200).nullable(),
  quota: z.string().max(80).nullable(),
  category: z.string().max(80).nullable(),
  closingRank: z.number().int().nullable(),
  openingRank: z.number().int().nullable(),
  seatCount: z.number().int().nullable(),
  round: z.number().int().nullable(),
  /** The model's own read confidence for this row, 0-100. */
  confidence: z.number().min(0).max(100),
  unreadable: z.boolean().default(false),
});

const pageResultSchema = z.object({
  isCutoffTable: z.boolean(),
  notes: z.string().max(500).nullable().optional(),
  rows: z.array(extractedRowSchema).max(400),
});

export type ExtractedRow = z.infer<typeof extractedRowSchema>;
export type PageResult = z.infer<typeof pageResultSchema>;

/**
 * The rule this entire feature turns on: transcribe, never infer.
 *
 * A counselling PDF is the source of truth. The model's job is OCR plus table
 * structure — not knowledge. It has no reliable memory of Indian counselling
 * cutoffs, so anything it "knows" rather than reads is fabrication.
 */
const SYSTEM_PROMPT = `You transcribe tables from Indian medical PG counselling result documents (MCC and state authorities).

YOU ARE AN OCR ENGINE, NOT AN EXPERT. These rules override everything else:

1. Report ONLY what is visibly printed on this page. Never use prior knowledge of Indian medical colleges, counselling results, or typical cutoff ranges.
2. If a value is missing, cut off, blurred, or ambiguous, return null for that field. NEVER estimate, infer, interpolate, or "correct" a value.
3. Never invent a row. If the page has no cutoff table, return isCutoffTable: false and an empty rows array.
4. Do not fill a value carried over from a previous row unless the page visibly repeats it. Merged cells that span rows may be repeated; blank cells may not.
5. Copy names exactly as printed, including abbreviations and spelling quirks. Do not expand "MAMC" to its full name or standardise "Radio Diagnosis" to "Radiology".
6. rawText must be the verbatim text of the row as printed. A reviewer uses it to check your parse against the page.
7. confidence is YOUR read certainty for that row: 90+ crisp and unambiguous, 60-89 legible with some doubt, below 60 anything you are guessing at. Be harsh. An overconfident wrong rank is far worse than a flagged uncertain one.
8. Set unreadable: true when you can see a row exists but cannot read it reliably.

Ranks are integers: strip commas and any rank-suffix text. If a cell holds a score rather than a rank, leave closingRank null.

Return ONLY JSON matching the given schema.`;

interface VisionUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface PageExtraction {
  page: PageResult;
  usage: VisionUsage;
}

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  // OpenAI's strict mode requires every property to appear in `required`;
  // optionality is expressed with a nullable type, not by omission.
  required: ['isCutoffTable', 'notes', 'rows'],
  properties: {
    isCutoffTable: { type: 'boolean' },
    notes: { type: ['string', 'null'] },
    rows: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'rawText', 'collegeName', 'branchName', 'quota', 'category',
          'closingRank', 'openingRank', 'seatCount', 'round', 'confidence', 'unreadable',
        ],
        properties: {
          rawText: { type: 'string' },
          collegeName: { type: ['string', 'null'] },
          branchName: { type: ['string', 'null'] },
          quota: { type: ['string', 'null'] },
          category: { type: ['string', 'null'] },
          closingRank: { type: ['integer', 'null'] },
          openingRank: { type: ['integer', 'null'] },
          seatCount: { type: ['integer', 'null'] },
          round: { type: ['integer', 'null'] },
          confidence: { type: 'number' },
          unreadable: { type: 'boolean' },
        },
      },
    },
  },
} as const;

export async function extractPage(params: {
  base64Png: string;
  pageNumber: number;
  hint?: string;
  model?: string;
  signal?: AbortSignal;
}): Promise<PageExtraction> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new VisionUnavailableError();

  const model = params.model ?? process.env.OPENAI_VISION_MODEL ?? 'gpt-4o';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    signal: params.signal,
    body: JSON.stringify({
      model,
      // Deterministic: the same page must transcribe identically every time,
      // otherwise the audit trail means nothing.
      temperature: 0,
      max_tokens: 8000,
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'cutoff_page', strict: true, schema: RESPONSE_SCHEMA },
      },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                `Page ${params.pageNumber}. Transcribe every cutoff row you can read.` +
                (params.hint ? `\n\nContext from the operator (may be wrong — the page wins): ${params.hint}` : ''),
            },
            {
              type: 'image_url',
              // "high" detail: rank digits are small and misreading one digit
              // shifts a rank by an order of magnitude.
              image_url: { url: `data:image/png;base64,${params.base64Png}`, detail: 'high' },
            },
          ],
        },
      ],
    }),
  });

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(json.error?.message ?? `OpenAI returned ${response.status}`);
  }

  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('Vision returned an empty response');

  const parsed = pageResultSchema.safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error(`Vision response did not match the schema: ${parsed.error.issues[0]?.message}`);
  }

  return {
    page: parsed.data,
    usage: {
      promptTokens: json.usage?.prompt_tokens ?? 0,
      completionTokens: json.usage?.completion_tokens ?? 0,
    },
  };
}
