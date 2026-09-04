import { expect, type Page } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import type { User } from '@prisma/client';

/**
 * Establishes a signed-in session without going through Google.
 *
 * Google's consent screen actively blocks automation, so no E2E suite can drive
 * a real OAuth round trip. Instead this mints the same session cookie NextAuth
 * would issue, signed with the deployment's own AUTH_SECRET and carrying the
 * same claims the jwt callback sets. Everything downstream — middleware, the
 * session callback, the /admin role gate, ownership checks — runs unmodified
 * against a genuine token.
 *
 * What this cannot cover is the Google redirect itself; auth.spec.ts asserts the
 * parts of that flow which are ours (the button, the redirect target, the error
 * states).
 */
export async function signInAs(page: Page, user: Pick<User, 'id' | 'email' | 'name' | 'role'>) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET must be set for E2E sign-in');

  // Auth.js derives its encryption key from the cookie name, so the salt must
  // match the cookie this token is stored under.
  const cookieName = 'authjs.session-token';

  const token = await encode({
    token: {
      sub: user.id,
      uid: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    secret,
    salt: cookieName,
    maxAge: 30 * 24 * 60 * 60,
  });

  await page.context().addCookies([
    {
      name: cookieName,
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Fills and submits the prediction form.
 *
 * The form is a single page: name, gender, state, category, marks and college
 * preference all submit together. Gender and preference are chip buttons rather
 * than native radios, so they are clicked by their visible text.
 */
export async function runPrediction(
  page: Page,
  overrides: { correct?: number; wrong?: number; state?: string } = {},
) {
  const { correct = 120, wrong = 40, state = 'Telangana' } = overrides;

  await page.goto('/predictor');

  // The name validator rejects digits, so an "E2E"-style name would fail.
  await page.getByLabel('Full name').fill('Aditi Sharma');
  await page.getByRole('button', { name: 'Female', exact: true }).click();

  await page.getByRole('combobox', { name: /^state$/i }).click();
  await page.getByRole('option', { name: state, exact: true }).click();

  await page.getByRole('combobox', { name: /^category$/i }).click();
  await page.getByRole('option', { name: 'General', exact: true }).click();

  await page.getByLabel('Correct answers').or(page.getByLabel('Correct questions')).fill(String(correct));
  await page.getByLabel('Wrong answers').or(page.getByLabel('Wrong questions')).fill(String(wrong));

  const submit = page.getByRole('button', { name: /predict my rank/i });
  await expect(submit).toBeEnabled();
  // noWaitAfter: the button disables itself on click and the page then
  // navigates, so the post-click actionability re-check would never settle.
  await submit.click({ noWaitAfter: true });

  await page.waitForURL(/\/predictor\/[a-z0-9]+/, { timeout: 60_000 });
  return page.url().split('/').pop()!;
}
