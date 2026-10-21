import { expect, test } from '@playwright/test';

/**
 * Every public page must render for a signed-out visitor.
 *
 * This is also the net for render-time crashes. The Button component once
 * passed a two-element array to Radix Slot for every `asChild` usage, which
 * threw during render — a class of bug no unit test in this repo would catch,
 * because it only appears when the component tree is actually mounted.
 */
const PUBLIC_PAGES: { path: string; heading: RegExp }[] = [
  { path: '/', heading: /know your neet pg possibilities/i },
  { path: '/neet-pg-counselling', heading: /neet pg counselling \d{4}/i },
  { path: '/sample-report', heading: /what your report looks like/i },
  { path: '/support', heading: /help & support/i },
  { path: '/terms', heading: /terms of service/i },
  { path: '/privacy', heading: /privacy policy/i },
  { path: '/refund-policy', heading: /refund policy/i },
  { path: '/login', heading: /sign in to/i },
];

test.describe('public pages', () => {
  for (const { path, heading } of PUBLIC_PAGES) {
    test(`${path} renders`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));

      const response = await page.goto(path);

      expect(response?.status(), `${path} should return 200`).toBe(200);
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
      expect(errors, `${path} threw in the browser`).toEqual([]);
    });
  }

  test('the landing page states the rank range and the disclaimer', async ({ page }) => {
    await page.goto('/');
    // The product promise is an estimate; the range and the caveat are not optional.
    await expect(page.getByText(/12,000\s*–\s*16,500/)).toBeVisible();
    await expect(page.getByText(/confidence/i).first()).toBeVisible();
  });

  test('the sample report never implies certainty', async ({ page }) => {
    await page.goto('/sample-report');
    await expect(page.getByText(/actual ranks and counseling outcomes may vary/i).first()).toBeVisible();
  });

  test('robots.txt keeps private routes out of the index', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    const body = await response!.text();
    expect(body).toContain('Disallow: /dashboard');
    expect(body).toContain('Disallow: /admin');
    expect(body).toContain('Sitemap:');
  });
});

test.describe('search visibility', () => {
  test('the counselling guide is linked site-wide and carries its own canonical', async ({ page }) => {
    await page.goto('/');
    // Linked from the primary nav or the footer on the homepage, not only the sitemap.
    await expect(page.locator('a[href="/neet-pg-counselling"]').first()).toBeAttached();

    await page.goto('/neet-pg-counselling');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toMatch(/\/neet-pg-counselling$/);
    await expect(page.getByRole('heading', { name: /counselling schedule/i })).toBeVisible();
  });

  test('the sitemap lists the counselling guide', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    const body = await response!.text();
    expect(body).toContain('/neet-pg-counselling</loc>');
  });
});
