import { cleanupE2EData, db } from './helpers/db';

/**
 * Removes every account this suite created, and with it (via cascade) the
 * predictions, credits, reports and audit rows that hang off them.
 *
 * Runs even when tests fail, so a red run never leaves data behind.
 */
export default async function globalTeardown() {
  try {
    const removed = await cleanupE2EData();
    console.log(`\n[e2e] cleaned up ${removed} test account${removed === 1 ? '' : 's'}`);
  } finally {
    await db.$disconnect();
  }
}
