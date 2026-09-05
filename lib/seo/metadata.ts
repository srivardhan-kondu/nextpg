import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

/**
 * The generated social card (`app/opengraph-image.tsx`).
 *
 * Declared explicitly rather than relying on Next's file convention: a segment
 * that exports its own `openGraph` object replaces the parent's entirely, which
 * drops the auto-injected image along with it. Every page here sets
 * `openGraph`, so every page must carry the image itself.
 */
const OG_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: `${siteConfig.brand} — NEET PG rank and college predictor`,
} as const;

/**
 * Page metadata with a canonical URL attached.
 *
 * Canonicals were missing site-wide, which leaves Google to pick a
 * representative URL itself — and it picks badly once a page is reachable with
 * tracking parameters, with and without a trailing slash, or on a preview
 * domain. Every indexable page should route through this.
 */
export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  /** Set for pages that exist for users but should not compete in search. */
  noindex?: boolean;
  keywords?: readonly string[];
}): Metadata {
  const url = new URL(input.path, siteConfig.url).toString();

  return {
    title: input.title,
    description: input.description,
    ...(input.keywords?.length ? { keywords: [...input.keywords] } : {}),
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      url,
      siteName: siteConfig.brand,
      title: input.title,
      description: input.description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [OG_IMAGE.url],
    },
    ...(input.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
