import { expect, test } from '@playwright/test';
import { createUser, testEmail } from './helpers/db';
import { runPrediction, signInAs } from './helpers/auth';

test.describe('dashboard and reports', () => {
  test('a new account sees empty states, not errors', async ({ page }) => {
    const user = await createUser({ email: testEmail('empty'), credits: 0 });
    await signInAs(page, user);

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /no predictions yet/i })).toBeVisible();
    await expect(page.getByText(/you are out of credits/i)).toBeVisible();

    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: /no reports yet/i })).toBeVisible();
  });

  test('credit tiles reflect the real balance', async ({ page }) => {
    const user = await createUser({ email: testEmail('tiles'), credits: 5 });
    await signInAs(page, user);

    await page.goto('/dashboard');
    // Located by label rather than class: the design is actively changing, and
    // a tile's label is semantic where its styling is not. Scoped to #main
    // because the sidebar widget carries the same label.
    const tile = page.locator('#main').getByText('Credits remaining', { exact: true }).first().locator('..');
    await expect(tile).toContainText('5');
  });

  test('a prediction appears in history and in reports', async ({ page }) => {
    const user = await createUser({ email: testEmail('history'), credits: 2 });
    await signInAs(page, user);
    await runPrediction(page);

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /prediction history/i })).toBeVisible();
    await expect(page.getByText('Preview').first()).toBeVisible();

    await page.goto('/reports');
    await expect(page.getByRole('link', { name: /view report/i }).first()).toBeVisible();
  });

  test('the credits page offers the pack without a payment provider configured', async ({ page }) => {
    const user = await createUser({ email: testEmail('credits'), credits: 1 });
    await signInAs(page, user);

    await page.goto('/credits');
    await expect(page.getByRole('heading', { name: /5 prediction credits/i })).toBeVisible();
    // exact: the sidebar's "Buy 5 more · ₹99" link also contains this.
    await expect(page.getByText('₹99', { exact: true })).toBeVisible();
    // Razorpay is unset locally, so the page must explain rather than break.
    await expect(
      page.getByRole('heading', { name: /payments are not configured/i }).or(
        page.getByRole('button', { name: /get 5 credits/i }),
      ),
    ).toBeVisible();
  });
});
