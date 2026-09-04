import type { Metadata } from 'next';

import { requireUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { ProfileForm } from '@/features/auth/components/profile-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const user = await requireUser('/profile');

  const profile = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      name: true, email: true, phone: true, gender: true,
      defaultState: true, defaultCategory: true, createdAt: true,
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Profile"
        description="These details pre-fill your prediction form. Changing them never rewrites a report you already generated."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>
            Signed in as {profile.email} · member since {formatDate(profile.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaults={{
              name: profile.name ?? '',
              phone: profile.phone ?? '',
              gender: profile.gender ?? undefined,
              defaultState: profile.defaultState ?? undefined,
              defaultCategory: profile.defaultCategory ?? undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
