import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { GUIDE_UPDATED } from '@/lib/content/counselling';
import { seoRepository } from '@/repositories/seo.repository';

/**
 * Public pages only — everything behind auth is excluded by robots.ts too.
 *
 * The cutoff entries are generated from the database rather than hand-listed,
 * so every newly verified college or branch enters the index without a code
 * change, and an unverified one can never leak in. A sitemap that advertises
 * URLs which render "no data yet" trains Google to crawl this site less, so
 * the same publication gate that governs the pages governs this list.
 */
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const url = (path: string) => new URL(path, siteConfig.url).toString();

  // `lastModified` is only given where we know when the content changed.
  // Google uses it only while it stays accurate, so stamping every URL with
  // the request time (as this once did) teaches it to ignore the field.
  // The homepage's counselling FAQ and notice come from the guide's content
  // file, so the two share a date. Legal pages carry their own "last updated".
  const LEGAL_UPDATED = new Date('2026-09-04');
  const guideUpdated = new Date(GUIDE_UPDATED);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: siteConfig.url, lastModified: guideUpdated, changeFrequency: 'weekly', priority: 1 },
    { url: url('/neet-pg-counselling'), lastModified: guideUpdated, changeFrequency: 'daily', priority: 0.95 },
    { url: url('/sample-report'), changeFrequency: 'monthly', priority: 0.8 },
    { url: url('/support'), changeFrequency: 'monthly', priority: 0.5 },
    { url: url('/terms'), lastModified: LEGAL_UPDATED, changeFrequency: 'yearly', priority: 0.3 },
    { url: url('/privacy'), lastModified: LEGAL_UPDATED, changeFrequency: 'yearly', priority: 0.3 },
    { url: url('/refund-policy'), lastModified: LEGAL_UPDATED, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // A database outage must not take the sitemap down with it: Google treats a
  // 500 here as a reason to stop trusting the file. Fall back to static-only.
  let colleges: string[] = [];
  let branches: string[] = [];
  let states: string[] = [];
  let lastVerified: Date | null = null;

  try {
    [{ colleges, branches, states }, lastVerified] = await Promise.all([
      seoRepository.publishedSlugs(),
      seoRepository.lastVerifiedAt(),
    ]);
  } catch {
    return staticEntries;
  }

  const hasCutoffPages = colleges.length > 0 || branches.length > 0;
  const modified = lastVerified ?? now;

  return [
    ...staticEntries,
    ...(hasCutoffPages
      ? [
          {
            url: url('/neet-pg-cutoffs'),
            lastModified: modified,
            changeFrequency: 'weekly' as const,
            priority: 0.9,
          },
        ]
      : []),
    ...states.map((slug) => ({
      url: url(`/neet-pg-cutoffs/state/${slug}`),
      lastModified: modified,
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    })),
    ...branches.map((slug) => ({
      url: url(`/neet-pg-cutoffs/branch/${slug}`),
      lastModified: modified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...colleges.map((slug) => ({
      url: url(`/neet-pg-cutoffs/college/${slug}`),
      lastModified: modified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
