'use server';

import { issueOtp } from '@/lib/auth/otp';
import { sendOtpEmail } from '@/lib/auth/mailer';
import { emailSchema, profileSchema } from '@/validators/auth.schema';
import { enforceRateLimit, RateLimitError } from '@/lib/security/rate-limit';
import { getClientIp } from '@/lib/security/request';
import { audit } from '@/lib/security/audit';
import { requireUserOrThrow } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sanitizeText } from '@/lib/security/sanitize';

export type ActionState = { ok: boolean; message?: string; fieldErrors?: Record<string, string[]> };

export async function requestOtpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email } = parsed.data;
  const ip = await getClientIp();

  try {
    // Two buckets: per-address stops targeting one inbox, per-IP stops spraying.
    await enforceRateLimit('otpRequest', `email:${email}`);
    await enforceRateLimit('otpRequest', `ip:${ip}`);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { ok: false, message: 'Too many code requests. Please wait a few minutes and try again.' };
    }
    throw error;
  }

  try {
    const otp = await issueOtp(email);
    await sendOtpEmail(email, otp);
    await audit({ action: 'auth.otp.request', entityType: 'email', metadata: { email } });
    return { ok: true, message: 'We sent a 6-digit code to your email.' };
  } catch (error) {
    console.error('[auth] failed to issue OTP', error);
    return { ok: false, message: 'We could not send the code right now. Please try again.' };
  }
}

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
