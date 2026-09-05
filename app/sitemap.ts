import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
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

  const staticEntries: MetadataRoute.Sitemap = [
    { url: siteConfig.url, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: url('/sample-report'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: url('/support'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: url('/terms'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: url('/privacy'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: url('/refund-policy'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // A database outage must not take the sitemap down with it: Google treats a
  // 500 here as a reason to stop trusting the file. Fall back to static-only.
  let colleges: string[] = [];
  let branches: string[] = [];
  let lastVerified: Date | null = null;

  try {
    [{ colleges, branches }, lastVerified] = await Promise.all([
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
