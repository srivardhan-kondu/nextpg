import { z } from 'zod';
import { INDIAN_STATES, BRANCHES } from '@/lib/constants';
import { EXAM } from '@/config/site';

const stateEnum = z.enum(INDIAN_STATES as unknown as [string, ...string[]]);

export const personalDetailsSchema = z.object({
  candidateName: z
    .string()
    .trim()
    .min(2, 'Please enter your full name')
    .max(80, 'Name is too long')
    .regex(/^[\p{L}\s.'-]+$/u, 'Name can only contain letters, spaces and . \' -'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { required_error: 'Select your gender' }),
  state: stateEnum,
  category: z.enum(['GENERAL', 'EWS', 'OBC', 'SC', 'ST'], { required_error: 'Select your category' }),
  subCategory: z.enum(['NONE', 'PWD', 'ARMED_FORCES', 'NRI', 'MANAGEMENT', 'MINORITY']).default('NONE'),
});

export const examDetailsSchema = z
  .object({
    correctAnswers: z.coerce
      .number({ invalid_type_error: 'Enter a number' })
      .int('Must be a whole number')
      .min(0, 'Cannot be negative')
      .max(EXAM.totalQuestions, `Cannot exceed ${EXAM.totalQuestions}`),
    wrongAnswers: z.coerce
      .number({ invalid_type_error: 'Enter a number' })
      .int('Must be a whole number')
      .min(0, 'Cannot be negative')
      .max(EXAM.totalQuestions, `Cannot exceed ${EXAM.totalQuestions}`),
    expectedScore: z.coerce
      .number({ invalid_type_error: 'Enter a number' })
      .int('Must be a whole number')
      .min(-EXAM.totalQuestions, 'Score is out of range')
      .max(EXAM.maxScore, `Score cannot exceed ${EXAM.maxScore}`),
  })
  .refine((d) => d.correctAnswers + d.wrongAnswers <= EXAM.totalQuestions, {
    message: `Correct + wrong cannot exceed ${EXAM.totalQuestions} questions`,
    path: ['wrongAnswers'],
  });

export const preferencesSchema = z.object({
  preferredType: z.enum(['GOVERNMENT', 'PRIVATE', 'DEEMED', 'DNB', 'ANY']).default('ANY'),
});

export const createPredictionSchema = personalDetailsSchema
  .merge(preferencesSchema)
  .merge(
    z.object({
      correctAnswers: z.coerce.number().int().min(0).max(EXAM.totalQuestions),
      wrongAnswers: z.coerce.number().int().min(0).max(EXAM.totalQuestions),
      expectedScore: z.coerce.number().int().min(-EXAM.totalQuestions).max(EXAM.maxScore),
    }),
  )
  .refine((d) => d.correctAnswers + d.wrongAnswers <= EXAM.totalQuestions, {
    message: `Correct + wrong cannot exceed ${EXAM.totalQuestions} questions`,
    path: ['wrongAnswers'],
  });

export type PersonalDetailsInput = z.infer<typeof personalDetailsSchema>;
export type ExamDetailsInput = z.infer<typeof examDetailsSchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;
export type CreatePredictionInput = z.infer<typeof createPredictionSchema>;

export const dreamValidationSchema = z.object({
  predictionId: z.string().cuid().optional(),
  dreamBranch: z.enum(BRANCHES as unknown as [string, ...string[]], {
    required_error: 'Select a dream branch',
  }),
  dreamCollegeId: z.string().cuid().optional(),
  dreamCollegeName: z.string().trim().max(160).optional(),
});

export type DreamValidationFormInput = z.infer<typeof dreamValidationSchema>;

export const unlockPredictionSchema = z.object({ predictionId: z.string().cuid() });
