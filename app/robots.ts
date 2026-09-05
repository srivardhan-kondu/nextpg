import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Authenticated surfaces carry personal data and have nothing to index.
      // `/credits`, `/dream-validator` and `/blocked` are listed for the same
      // reason as the rest — middleware already bounces them to /login, and a
      // crawled redirect chain is wasted crawl budget on a small site.
      disallow: [
        '/api/', '/admin', '/admin/', '/dashboard', '/reports', '/profile',
        '/predictor', '/dream-validator', '/credits', '/login', '/blocked',
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
