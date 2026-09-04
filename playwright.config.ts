import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import dotenv from 'dotenv';

// E2E runs against a real server and a real database, so the same .env.local
// the app uses must be loaded before the config is evaluated.
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',

  // Money and credit assertions read a shared balance, so workers must not
  // interleave against the same account. Each spec creates its own user, but
  // serial execution keeps failures readable and the database calm.
  fullyParallel: false,
  workers: 1,

  // A flake here usually means a real race, so surface it rather than retry it
  // away locally. CI retries once to absorb genuine network noise.
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),

  timeout: 90_000,
  expect: { timeout: 15_000 },

  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // Reuses a server you already have running; starts one otherwise.
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
