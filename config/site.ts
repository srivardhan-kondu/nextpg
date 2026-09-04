/**
 * Single source of truth for brand + commercial constants.
 * The UI reference brands the product "NextPG"; change BRAND here to rename
 * everywhere (nav, PDF cover, emails, metadata) in one edit.
 */
export const siteConfig = {
  brand: 'NextPG',
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

export const EXAM_YEAR = 2025;
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
