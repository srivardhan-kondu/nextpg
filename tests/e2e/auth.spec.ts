import { expect, test } from '@playwright/test';
import { createUser, testEmail } from './helpers/db';
import { signInAs } from './helpers/auth';

/**
 * Google is the only sign-in method and doubles as signup.
 *
 * The consent screen itself cannot be automated, so these tests cover the parts
 * of the flow this codebase owns: what the login screen offers, where the guards
 * send people, and how failures surface.
 */

const PROTECTED = ['/dashboard', '/predictor', '/dream-validator', '/reports', '/credits', '/profile'];

/** The login screen renders differently depending on whether Google is set up. */
const GOOGLE_CONFIGURED = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

test.describe('login screen', () => {
  test.skip(!GOOGLE_CONFIGURED, 'requires GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET');

  test('offers Google and nothing else', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();

    // No email/password surface should exist anywhere on the page.
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await expect(page.locator('input[type="email"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /send login code/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /sign up|create account/i })).toHaveCount(0);
  });

  test('says that signing in also creates the account', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/first sign-in creates your account/i)).toBeVisible();
  });

  test('the Google button starts the OAuth handshake', async ({ page }) => {
    await page.goto('/login');

    // Follow only as far as our own signin endpoint — never out to Google.
    const request = page.waitForRequest((r) => r.url().includes('/api/auth/signin/google'));
    await page.getByRole('button', { name: /continue with google/i }).click();

    expect((await request).method()).toBe('POST');
  });

  test('an OAuth error is explained rather than swallowed', async ({ page }) => {
    await page.goto('/login?error=OAuthAccountNotLinked');
    await expect(page.getByText(/already registered through a different sign-in method/i)).toBeVisible();
  });
});

test.describe('login screen without Google configured', () => {
  test.skip(GOOGLE_CONFIGURED, 'only meaningful when Google is unset');

  test('degrades to a clear notice instead of a dead button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/sign-in is unavailable/i)).toBeVisible();
    await expect(page.getByText(/GOOGLE_CLIENT_ID/)).toBeVisible();
    // Never offer a control that cannot work.
    await expect(page.getByRole('button', { name: /continue with google/i })).toHaveCount(0);
  });
});

test.describe('session and guards', () => {
  test('protected routes bounce a signed-out visitor to login', async ({ page }) => {
    for (const route of PROTECTED) {
      await page.goto(route);
      await expect(page, `${route} should require auth`).toHaveURL(/\/login/);
      // The intended destination is preserved so login can return them.
      expect(page.url(), `${route} should keep a callbackUrl`).toContain('callbackUrl');
    }
  });

  test('a signed-in user is kept off the login screen', async ({ page }) => {
    const user = await createUser({ email: testEmail('nologin') });
    await signInAs(page, user);

    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('a session reaches the dashboard as the right user', async ({ page }) => {
    const user = await createUser({ email: testEmail('session'), credits: 2 });
    await signInAs(page, user);

    await page.goto('/dashboard');
    // Greeting copy is a design choice; the credit summary is the page's job.
    // The label appears in both the sidebar widget and the stat grid.
    await expect(page.getByText('Credits remaining', { exact: true }).first()).toBeVisible();

    const session = await page.request.get('/api/auth/session');
    const body = (await session.json()) as { user: { email: string; role: string } };
    expect(body.user.email).toBe(user.email);
    expect(body.user.role).toBe('USER');
  });

});
