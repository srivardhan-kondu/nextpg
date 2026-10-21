import { describe, expect, it } from 'vitest';
import {
  SCHEDULE, currentStage, formatDay, formatLong, formatRange, todayInIndia,
} from '@/lib/content/counselling';
import { articleSchema, faqSchema, websiteSchema } from '@/lib/seo/structured-data';

describe('counselling dates', () => {
  it('formats single days, same-month and cross-month ranges', () => {
    expect(formatDay('2026-10-24')).toBe('24 Oct');
    expect(formatLong('2026-09-24')).toBe('24 September 2026');
    expect(formatRange(['2026-10-12', '2026-10-21'])).toBe('12–21 Oct');
    expect(formatRange(['2026-10-26', '2026-11-02'])).toBe('26 Oct – 2 Nov');
  });

  it('uses the Indian calendar day, not UTC', () => {
    // 20:00 UTC on 20 Oct is already 21 Oct in India.
    expect(todayInIndia(new Date('2026-10-20T20:00:00Z'))).toBe('2026-10-21');
  });

  it('keeps every round in date order', () => {
    for (const r of SCHEDULE) {
      expect(r.registration[0] <= r.registration[1]).toBe(true);
      expect(r.choiceFilling[1] <= r.result).toBe(true);
      expect(r.result <= r.reporting[1]).toBe(true);
    }
    for (let i = 1; i < SCHEDULE.length; i++) {
      expect(SCHEDULE[i - 1]!.reporting[1] < SCHEDULE[i]!.registration[0]).toBe(true);
    }
  });

  it.each([
    ['2026-10-01', 'Round 1 registration opens 12 Oct'],
    ['2026-10-15', 'Round 1 registration is open until 21 Oct'],
    ['2026-10-21', 'Round 1 registration closes today, 21 Oct (12 noon)'],
    ['2026-10-22', 'Round 1 choice locking closes today, 22 Oct'],
    ['2026-10-23', 'Round 1 seat allotment result due 24 Oct'],
    ['2026-10-24', 'Round 1 seat allotment result expected today, 24 Oct'],
    ['2026-10-25', 'Round 1 reporting and joining: 26 Oct – 2 Nov'],
    ['2026-10-30', 'Round 1 reporting and joining open until 2 Nov'],
    ['2026-11-04', 'Round 2 registration opens 6 Nov'],
    ['2026-12-20', 'Stray vacancy round registration is open until 21 Dec'],
  ])('on %s the stage reads "%s"', (day, expected) => {
    expect(currentStage(day)).toBe(expected);
  });

  it('reports no stage once the last round has closed', () => {
    expect(currentStage('2027-01-05')).toBeNull();
  });
});

describe('structured data', () => {
  it('gives each page its own FAQ id', () => {
    const faqs = [{ q: 'Q', a: 'A' }];
    const home = faqSchema(faqs, '/')['@id'];
    const guide = faqSchema(faqs, '/neet-pg-counselling')['@id'];
    expect(home).not.toBe(guide);
    expect(guide).toMatch(/\/neet-pg-counselling#faq$/);
  });

  it('does not advertise a site search box', () => {
    expect(websiteSchema()).not.toHaveProperty('potentialAction');
  });

  it('states the article dates it is given, not the render date', () => {
    const article = articleSchema({
      headline: 'h', description: 'd', path: '/x',
      datePublished: '2026-10-21', dateModified: '2026-10-21',
    });
    expect(article.datePublished).toBe('2026-10-21');
    expect(article.dateModified).toBe('2026-10-21');
  });
});
