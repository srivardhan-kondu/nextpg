import { expect, test } from '@playwright/test';
import { createUser, testEmail } from './helpers/db';
import { runPrediction, signInAs } from './helpers/auth';

test.describe('dream validator', () => {
  test('it refuses to run before any prediction exists', async ({ page }) => {
    const user = await createUser({ email: testEmail('nodream'), credits: 1 });
    await signInAs(page, user);

    await page.goto('/dream-validator');
    await expect(page.getByRole('heading', { name: /run a prediction first/i })).toBeVisible();
  });

  test('it stays behind the paywall until the report is unlocked', async ({ page }) => {
    const user = await createUser({ email: testEmail('lockeddream'), credits: 0 });
    await signInAs(page, user);
    await runPrediction(page);

    await page.goto('/dream-validator');
    await expect(page.getByRole('heading', { name: /unlock your report/i })).toBeVisible();
  });

  test('it validates a dream branch and college against the estimated rank', async ({ page }) => {
    const user = await createUser({ email: testEmail('dream'), credits: 2 });
    await signInAs(page, user);
    await runPrediction(page);

    await page.getByRole('button', { name: /unlock full report/i }).click();
    await expect(page.getByRole('heading', { name: /college possibilities/i })).toBeVisible({
      timeout: 45_000,
    });

    await page.goto('/dream-validator');

    await page.getByRole('combobox', { name: /dream branch/i }).click();
    await page.getByRole('option', { name: 'Radiology', exact: true }).click();
    await page.getByRole('button', { name: /validate my dream/i }).click();

    await expect(page.getByRole('heading', { name: 'Radiology' })).toBeVisible({ timeout: 45_000 });

    // A probability and a likelihood band, never a yes/no verdict.
    await expect(page.getByText(/%/).first()).toBeVisible();
    await expect(
      page.getByText(/strong chance|moderate chance|stretch chance|very difficult/i).first(),
    ).toBeVisible();
    await expect(page.getByText(/actual ranks and counseling outcomes may vary/i).first()).toBeVisible();
  });
});
