import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Authenticated surfaces carry personal data and have nothing to index.
      disallow: [
        '/api/', '/admin', '/admin/', '/dashboard', '/reports', '/profile',
        '/predictor/', '/login',
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
