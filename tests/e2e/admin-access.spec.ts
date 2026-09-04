import { expect, test } from '@playwright/test';
import { createUser, testEmail } from './helpers/db';
import { signInAs } from './helpers/auth';

/**
 * Regression suite for a bug that shipped: the session callback mapping
 * token.role onto session.user.role lived only in auth.ts, while middleware
 * builds its session from auth.config.ts. session.user.role was therefore
 * undefined in middleware and the /admin gate redirected everyone — including
 * a SUPER_ADMIN. Build, typecheck and 87 unit tests all passed.
 *
 * Only a real request through real middleware catches that, which is why these
 * assertions are here and not in the unit suite.
 */

const ADMIN_ROUTES = [
  '/admin',
  '/admin/colleges',
  '/admin/branches',
  '/admin/cutoffs',
  '/admin/quota-rules',
  '/admin/users',
  '/admin/payments',
  '/admin/reports',
  '/admin/import',
];

test.describe('admin authorization', () => {
  test('a super admin reaches every admin route', async ({ page }) => {
    const user = await createUser({ email: testEmail('superadmin'), role: 'SUPER_ADMIN' });
    await signInAs(page, user);

    for (const route of ADMIN_ROUTES) {
      const response = await page.goto(route);
      expect(response?.status(), `${route} should return 200`).toBe(200);
      // Landing on the URL we asked for proves middleware did not bounce us.
      expect(page.url(), `${route} should not redirect`).toContain(route);
    }
  });

  test('a plain user is redirected away from every admin route', async ({ page }) => {
    const user = await createUser({ email: testEmail('plainuser'), role: 'USER' });
    await signInAs(page, user);

    for (const route of ADMIN_ROUTES) {
      await page.goto(route);
      await expect(page, `${route} should redirect a non-admin`).toHaveURL(/\/dashboard/);
    }
  });

  test('a signed-out visitor is sent to login, not to the admin panel', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
    // The intended destination is preserved so login can return them.
    expect(page.url()).toContain('callbackUrl');
  });

  test('the admin analytics page renders its metrics', async ({ page }) => {
    const user = await createUser({ email: testEmail('adminmetrics'), role: 'SUPER_ADMIN' });
    await signInAs(page, user);

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
    // exact: true — the hint text under other tiles also contains these words.
    await expect(page.getByText('Total users', { exact: true })).toBeVisible();
    await expect(page.getByText('Revenue', { exact: true }).first()).toBeVisible();
    // Data coverage drives prediction quality, so it must always be shown.
    await expect(page.getByText('Cutoff rows', { exact: true })).toBeVisible();
  });
});
