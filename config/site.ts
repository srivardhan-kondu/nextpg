/**
 * Single source of truth for brand + commercial constants.
 * `brand` drives every user-visible name (nav, logo, PDF cover, page titles,
 * metadata) — rename here and it propagates in one edit.
 *
 * supportEmail is deliberately NOT derived from the brand: it is a real mailbox
 * on a domain we own, and renaming the product does not move it.
 */
export const siteConfig = {
  brand: 'NextPG Predictor',
  tagline: 'Predict Your Rank. Validate Your Dream. Plan Your PG Journey.',
  description:
    'Get rank estimates, branch validation, college recommendations, AIQ insights, and state quota opportunities for NEET PG.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  supportEmail: 'support@nextpg.in',
  ogImage: '/og.png',
} as const;

/** Commercial model: no subscriptions, one credit pack. */
export const pricing = {
  packName: '5 Prediction Credits',
  credits: 5,
  amountInPaise: 9900,
  amountLabel: '₹99',
  currency: 'INR',
} as const;

/** A report costs exactly one credit. Re-opening an unlocked report is free forever. */
export const CREDITS_PER_REPORT = 1;

/**
 * The exam this product predicts for. Display and stamping only — no data
 * lookup keys off it (see rule-based.provider.ts), so it can move without
 * dragging cutoff or quota-rule queries along with it.
 */
export const EXAM_YEAR = 2026;

/** The most recent year we hold closing-rank data for. Drives every lookup. */
export const LATEST_CUTOFF_YEAR = 2024;

/** NEET PG scoring: +4 correct, -1 wrong, 200 questions. */
export const EXAM = {
  totalQuestions: 200,
  marksPerCorrect: 4,
  negativePerWrong: 1,
  maxScore: 800,
} as const;

export const PREDICTION_DISCLAIMER =
  'Predictions are based on historical trends and available data. Actual ranks and counseling outcomes may vary.';
