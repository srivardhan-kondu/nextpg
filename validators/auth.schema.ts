import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')
    .optional()
    .or(z.literal('')),
  defaultState: z.string().max(60).optional(),
  defaultCategory: z.enum(['GENERAL', 'EWS', 'OBC', 'SC', 'ST']).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
