/**
 * Promotes a user to admin.
 *
 *   npm run create:admin -- you@example.com [--super]
 *
 * The user must already exist (sign in once first) — this script deliberately
 * cannot create an account, so it can never mint a login that bypasses auth.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const email = args.find((a) => !a.startsWith('--'))?.toLowerCase();
  const isSuper = args.includes('--super');

  if (!email) {
    console.error('Usage: npm run create:admin -- you@example.com [--super]');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user with email ${email}. Ask them to sign in once, then re-run this.`);
    process.exit(1);
  }

  const role = isSuper ? 'SUPER_ADMIN' : 'ADMIN';

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { role } }),
    prisma.adminUser.upsert({
      where: { userId: user.id },
      update: { notes: `Promoted via CLI on ${new Date().toISOString()}` },
      create: { userId: user.id, permissions: ['*'], notes: 'Created via CLI' },
    }),
    prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'admin.promote.cli',
        entityType: 'user',
        entityId: user.id,
        severity: 'critical',
        metadata: { role },
      },
    }),
  ]);

  console.log(`✓ ${email} is now ${role}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
