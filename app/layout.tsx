import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { siteConfig } from '@/config/site';
import { JsonLd } from '@/components/seo/json-ld';
import { graph, organizationSchema, websiteSchema } from '@/lib/seo/structured-data';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.brand} — Know Your PG Possibilities in 60 Seconds`,
    template: `%s · ${siteConfig.brand}`,
  },
  description: siteConfig.description,
  keywords: [
    'NEET PG rank predictor', 'NEET PG college predictor', 'AIQ counselling',
    'state quota PG', 'MD MS admission', 'PG medical counselling', 'NEET PG 2026',
  ],
  authors: [{ name: siteConfig.brand }],
  creator: siteConfig.brand,
  publisher: siteConfig.brand,
  alternates: { canonical: '/' },
  category: 'education',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteConfig.url,
    siteName: siteConfig.brand,
    title: `${siteConfig.brand} — Know Your PG Possibilities in 60 Seconds`,
    description: siteConfig.description,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: siteConfig.brand }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.brand} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: ['/opengraph-image'],
  },
  // `max-image-preview:large` is what makes a result eligible for the large
  // thumbnail treatment; the bare index/follow default opts out of it.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1220' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className="light" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <JsonLd data={graph(organizationSchema(), websiteSchema())} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
