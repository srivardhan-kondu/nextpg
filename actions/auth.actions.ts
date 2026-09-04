'use server';

import { profileSchema } from '@/validators/auth.schema';
import { audit } from '@/lib/security/audit';
import { requireUserOrThrow } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sanitizeText } from '@/lib/security/sanitize';

export type ActionState = { ok: boolean; message?: string; fieldErrors?: Record<string, string[]> };

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserOrThrow();

  const parsed = profileSchema.safeParse({
    name: formData.get('name') || undefined,
    phone: formData.get('phone') || undefined,
    defaultState: formData.get('defaultState') || undefined,
    defaultCategory: formData.get('defaultCategory') || undefined,
    gender: formData.get('gender') || undefined,
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, phone, defaultState, defaultCategory, gender } = parsed.data;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: name ? sanitizeText(name, 80) : undefined,
      phone: phone || null,
      defaultState: defaultState || null,
      defaultCategory: defaultCategory ?? null,
      gender: gender ?? null,
    },
  });

  await audit({ userId: user.id, action: 'user.profile.update', entityType: 'user', entityId: user.id });
  revalidatePath('/profile');
  return { ok: true, message: 'Profile updated.' };
}
