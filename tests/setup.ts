import '@testing-library/jest-dom/vitest';

// Deterministic env for tests that touch config or env validation. Set before
// any module under test reads process.env. NODE_ENV is left alone — Vitest
// already sets it to 'test' and TypeScript types it as read-only.
process.env.SKIP_ENV_VALIDATION = 'true';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
