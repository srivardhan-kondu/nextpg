import { expect, test } from '@playwright/test';
import { createUser, creditBalance, db, testEmail } from './helpers/db';
import { runPrediction, signInAs } from './helpers/auth';

/**
 * The money path, end to end: predict free, hit the paywall, spend exactly one
 * credit, get a PDF, and never be charged twice.
 *
 * Also the regression net for a bug that shipped: consumeCredit runs five
 * sequential queries inside an interactive transaction, and Prisma's 5s default
 * timeout was too tight for a pooled serverless Postgres — the unlock rolled
 * back mid-flight. Nothing but a real database round trip catches that.
 */

test.describe('prediction and paywall', () => {
  test('a prediction is free and shows a range, never a single rank', async ({ page }) => {
    const user = await createUser({ email: testEmail('freepredict'), credits: 0 });
    await signInAs(page, user);

    await runPrediction(page);

    // A range, not a point estimate — the core product promise.
    await expect(page.getByText(/^\d{1,3}(,\d{3})*\s*–\s*\d{1,3}(,\d{3})*$/).first()).toBeVisible();
    await expect(page.getByText(/confidence/i).first()).toBeVisible();
    await expect(page.getByText(/actual ranks and counseling outcomes may vary/i).first()).toBeVisible();
  });

  test('a locked report leaks no premium data to the browser', async ({ page }) => {
    const user = await createUser({ email: testEmail('paywall'), credits: 0 });
    await signInAs(page, user);
    await runPrediction(page);

    await expect(page.getByRole('heading', { name: /unlock your full report/i })).toBeVisible();

    // Redaction happens server-side, so the premium payload must be absent from
    // the delivered HTML — not merely hidden with CSS.
    //
    // Asserted against real data rather than section labels: the paywall
    // legitimately advertises "Counseling strategy" as one of the things a
    // credit unlocks, so that phrase appearing is expected.
    const html = await page.content();
    expect(html).not.toContain('Osmania Medical College');
    expect(html).not.toContain('Maulana Azad Medical College');
    expect(html).not.toContain('Lock your safety options first');
    expect(html).not.toContain('closed at or after your expected range');
  });

  test('with no credits the unlock routes to the credits page', async ({ page }) => {
    const user = await createUser({ email: testEmail('nocredits'), credits: 0 });
    await signInAs(page, user);
    await runPrediction(page);

    await page.getByRole('link', { name: /get 5 credits/i }).click();
    await expect(page).toHaveURL(/\/credits/);
  });

  test('unlocking spends exactly one credit and reveals the analysis', async ({ page }) => {
    const user = await createUser({ email: testEmail('unlock'), credits: 3 });
    await signInAs(page, user);
    await runPrediction(page);

    expect(await creditBalance(user.id)).toBe(3);

    await page.getByRole('button', { name: /unlock full report/i }).click();

    await expect(page.getByRole('heading', { name: /college possibilities/i })).toBeVisible({
      timeout: 45_000,
    });
    expect(await creditBalance(user.id)).toBe(2);

    // The premium sections the credit paid for.
    await expect(page.getByRole('heading', { name: /aiq analysis/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /state quota analysis/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /recommended branches/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /counseling strategy/i })).toBeVisible();
  });

  test('re-opening an unlocked report is free, forever', async ({ page }) => {
    const user = await createUser({ email: testEmail('reopen'), credits: 2 });
    await signInAs(page, user);
    const predictionId = await runPrediction(page);

    await page.getByRole('button', { name: /unlock full report/i }).click();
    await expect(page.getByRole('heading', { name: /college possibilities/i })).toBeVisible({
      timeout: 45_000,
    });
    const afterUnlock = await creditBalance(user.id);

    // Re-open several times; the balance must not move.
    for (let i = 0; i < 3; i++) {
      await page.goto(`/predictor/${predictionId}`);
      await expect(page.getByRole('heading', { name: /college possibilities/i })).toBeVisible();
    }

    expect(await creditBalance(user.id)).toBe(afterUnlock);
  });

  test('the PDF downloads and is a valid document', async ({ page }) => {
    const user = await createUser({ email: testEmail('pdf'), credits: 2 });
    await signInAs(page, user);
    await runPrediction(page);

    await page.getByRole('button', { name: /unlock full report/i }).click();
    await expect(page.getByRole('heading', { name: /college possibilities/i })).toBeVisible({
      timeout: 45_000,
    });

    const report = await db.report.findFirstOrThrow({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const response = await page.request.get(`/api/reports/${report.id}/download`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/pdf');
    // Personal data must never sit in a shared cache.
    expect(response.headers()['cache-control']).toContain('no-store');

    const body = await response.body();
    expect(body.subarray(0, 5).toString()).toBe('%PDF-');
    expect(body.byteLength).toBeGreaterThan(10_000);

    // Downloading does not consume a further credit.
    const before = await creditBalance(user.id);
    await page.request.get(`/api/reports/${report.id}/download`);
    expect(await creditBalance(user.id)).toBe(before);
  });

  test('one user cannot download another user\'s report', async ({ page }) => {
    const owner = await createUser({ email: testEmail('owner'), credits: 2 });
    await signInAs(page, owner);
    await runPrediction(page);
    await page.getByRole('button', { name: /unlock full report/i }).click();
    await expect(page.getByRole('heading', { name: /college possibilities/i })).toBeVisible({
      timeout: 45_000,
    });

    const report = await db.report.findFirstOrThrow({ where: { userId: owner.id } });

    // Sign in as somebody else and ask for the same report id.
    const intruder = await createUser({ email: testEmail('intruder'), credits: 1 });
    await page.context().clearCookies();
    await signInAs(page, intruder);

    const response = await page.request.get(`/api/reports/${report.id}/download`);
    // 404, not 403 — we do not confirm that somebody else's report exists.
    expect(response.status()).toBe(404);
  });
});
