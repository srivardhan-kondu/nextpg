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

/** Fills and submits the three-step prediction wizard. */
export async function runPrediction(
  page: Page,
  overrides: { correct?: number; wrong?: number; state?: string } = {},
) {
  const { correct = 120, wrong = 40, state = 'Telangana' } = overrides;

  await page.goto('/predictor');
  await expect(page.getByText(/Step 1 of 3/)).toBeVisible();

  // Step 1 — profile. The name must be letters only; the validator rejects
  // digits, so an "E2E"-style name would fail the form.
  await page.getByLabel('Full name').fill('Aditi Sharma');
  // The Radix radio itself is sr-only and the styled <label> sits on top of it,
  // so the label is both what a real user clicks and the only clickable target.
  await page.locator('label[for="gender-FEMALE"]').click();
  await expect(page.locator('#gender-FEMALE')).toHaveAttribute('data-state', 'checked');

  await page.getByRole('combobox', { name: /domicile state/i }).click();
  await page.getByRole('option', { name: state, exact: true }).click();
  await page.getByRole('combobox', { name: /^category$/i }).click();
  await page.getByRole('option', { name: 'General', exact: true }).click();

  await advanceStep(page, 2);

  // Step 2 — exam performance
  await page.getByLabel('Correct questions').fill(String(correct));
  await page.getByLabel('Wrong questions').fill(String(wrong));

  await advanceStep(page, 3);

  // Step 3 — preference already defaults to "Any", so just submit.
  const submit = page.getByRole('button', { name: /predict my rank/i });
  await expect(submit).toBeEnabled();
  // noWaitAfter: the button disables itself on click and the page then
  // navigates, so Playwright's post-click actionability re-check would wait
  // forever for it to become enabled again.
  await submit.click({ noWaitAfter: true });

  await page.waitForURL(/\/predictor\/[a-z0-9]+/, { timeout: 60_000 });
  return page.url().split('/').pop()!;
}

/**
 * Clicks Continue and waits for the wizard to actually advance.
 *
 * The step buttons swap in place: Continue on steps 1-2 is replaced by the
 * submit button on step 3, at the same position in the DOM. Without
 * noWaitAfter, Playwright sees the clicked element detach, retries the click,
 * and the retry lands on whatever now occupies that spot — submitting the form
 * a step early. Asserting the step indicator makes each transition explicit.
 */
async function advanceStep(page: Page, expected: 2 | 3) {
  await page.getByRole('button', { name: /^continue$/i }).click({ noWaitAfter: true });
  await expect(page.getByText(new RegExp(`Step ${expected} of 3`))).toBeVisible();
}
