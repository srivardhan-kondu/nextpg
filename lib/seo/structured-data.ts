import { siteConfig, pricing, EXAM_YEAR } from '@/config/site';

/**
 * JSON-LD builders.
 *
 * Structured data is the only channel that lets a small site win SERP real
 * estate against high-authority aggregators: FAQ accordions, price and rating
 * chips, and a sitelinks search box are granted on markup, not on domain age.
 *
 * Every builder returns a plain object. Rendering is `<JsonLd>`'s job, so the
 * shape stays trivially unit-testable and free of React.
 */

type Json = Record<string, unknown>;

const ORG_ID = `${siteConfig.url}/#organization`;
const SITE_ID = `${siteConfig.url}/#website`;

/** Absolute URL for a site-relative path. Google requires absolute in JSON-LD. */
export function absolute(path = '/'): string {
  return new URL(path, siteConfig.url).toString();
}

/**
 * The publisher entity. Everything else `@id`-references this rather than
 * repeating it, which is what lets Google merge the graph into one entity
 * instead of reading each page as an unrelated publisher.
 */
export function organizationSchema(): Json {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: siteConfig.brand,
    url: siteConfig.url,
    description: siteConfig.description,
    logo: { '@type': 'ImageObject', url: absolute('/icon.svg') },
    email: siteConfig.supportEmail,
    areaServed: { '@type': 'Country', name: 'India' },
    ...(siteConfig.socialProfiles.length ? { sameAs: siteConfig.socialProfiles } : {}),
  };
}

/**
 * WebSite + SearchAction. The search box is only granted when the target
 * template resolves to a real, working search URL — so it points at the public
 * cutoff explorer, not at an authenticated route.
 */
export function websiteSchema(): Json {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: siteConfig.url,
    name: siteConfig.brand,
    description: siteConfig.description,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-IN',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/neet-pg-cutoffs?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * The product itself. `WebApplication` (not SoftwareApplication) is the honest
 * type for a hosted tool, and the offer must state the real price: a free-tier
 * claim Google can't verify on the page is a rich-result rejection.
 */
export function webApplicationSchema(): Json {
  return {
    '@type': 'WebApplication',
    '@id': `${siteConfig.url}/#webapp`,
    name: `${siteConfig.brand} — NEET PG Rank & College Predictor`,
    url: siteConfig.url,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any (web browser)',
    browserRequirements: 'Requires JavaScript',
    inLanguage: 'en-IN',
    publisher: { '@id': ORG_ID },
    description:
      `Estimate your NEET PG ${EXAM_YEAR} rank from an expected score, then match it against ` +
      'published closing ranks to see realistic MD/MS colleges across AIQ, state and deemed quotas.',
    featureList: [
      'NEET PG rank estimate from expected score',
      'College and branch shortlist banded by likelihood',
      'All India Quota and state quota opportunity split',
      'Dream branch and dream college validation',
      'Downloadable PDF counselling report',
    ],
    offers: {
      '@type': 'Offer',
      price: (pricing.amountInPaise / 100).toFixed(2),
      priceCurrency: pricing.currency,
      name: pricing.packName,
      description: `${pricing.credits} report credits. The rank estimate itself is free.`,
      availability: 'https://schema.org/InStock',
      url: absolute('/credits'),
    },
  };
}

/** FAQ rich results — the highest-yield markup on the landing page. */
export function faqSchema(faqs: readonly { q: string; a: string }[]): Json {
  return {
    '@type': 'FAQPage',
    '@id': `${siteConfig.url}/#faq`,
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** Breadcrumb trail. Replaces the raw URL in the SERP with a readable path. */
export function breadcrumbSchema(trail: readonly { name: string; path: string }[]): Json {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: absolute(crumb.path),
    })),
  };
}

/**
 * A published cutoff table, as a Dataset.
 *
 * This is the deliberate differentiator: aggregators publish the same closing
 * ranks as undifferentiated HTML. Declaring provenance — who published it,
 * which counselling round, when we verified it — is what an E-E-A-T review
 * actually rewards, and it makes the page eligible for Google Dataset Search.
 */
export function cutoffDatasetSchema(input: {
  name: string;
  description: string;
  path: string;
  academicYear: number;
  sources: readonly string[];
  lastVerified?: Date | null;
}): Json {
  return {
    '@type': 'Dataset',
    name: input.name,
    description: input.description,
    url: absolute(input.path),
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    isAccessibleForFree: true,
    creator: { '@id': ORG_ID },
    temporalCoverage: String(input.academicYear),
    spatialCoverage: { '@type': 'Country', name: 'India' },
    ...(input.lastVerified ? { dateModified: input.lastVerified.toISOString() } : {}),
    ...(input.sources.length
      ? { citation: input.sources.map((s) => ({ '@type': 'CreativeWork', name: s })) }
      : {}),
  };
}

/**
 * Wraps builders into one `@graph`. One graph per page beats several loose
 * blocks: nodes can cross-reference by `@id` and Google reads a single entity.
 */
export function graph(...nodes: Json[]): Json {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
