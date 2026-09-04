'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Calculator, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Disclaimer } from '@/components/shared/disclaimer';
import { createPredictionAction } from '@/actions/prediction.actions';
import { createPredictionSchema, type CreatePredictionInput } from '@/validators/prediction.schema';
import {
  CATEGORY_OPTIONS, GENDER_OPTIONS, INDIAN_STATES, PREFERRED_TYPE_OPTIONS, SUB_CATEGORY_OPTIONS,
} from '@/lib/constants';
import { EXAM } from '@/config/site';
import { computeScore } from '@/services/prediction/scoring';
import { cn } from '@/lib/utils';

interface PredictionFormProps {
  defaults?: Partial<CreatePredictionInput>;
}

const STEPS = [
  { id: 1, title: 'Your details', hint: 'Who is this prediction for?' },
  { id: 2, title: 'Exam performance', hint: 'How did the paper go?' },
  { id: 3, title: 'Preferences', hint: 'What are you looking for?' },
] as const;

/** Which fields must be valid before the wizard advances past each step. */
const STEP_FIELDS: Record<number, (keyof CreatePredictionInput)[]> = {
  1: ['candidateName', 'gender', 'state', 'category', 'subCategory'],
  2: ['correctAnswers', 'wrongAnswers', 'expectedScore'],
  3: ['preferredType'],
};

function FieldError({ message, id }: { message?: string; id: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function PredictionForm({ defaults }: PredictionFormProps) {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [submitting, setSubmitting] = React.useState(false);
  // True until the user types in the score box; keeps the auto-calculation from
  // stomping on a deliberate manual override.
  const [scoreAuto, setScoreAuto] = React.useState(true);

  const form = useForm<CreatePredictionInput>({
    resolver: zodResolver(createPredictionSchema),
    mode: 'onTouched',
    defaultValues: {
      candidateName: defaults?.candidateName ?? '',
      gender: defaults?.gender ?? undefined,
      state: defaults?.state ?? undefined,
      category: defaults?.category ?? undefined,
      subCategory: defaults?.subCategory ?? 'NONE',
      correctAnswers: undefined as unknown as number,
      wrongAnswers: undefined as unknown as number,
      expectedScore: undefined as unknown as number,
      preferredType: defaults?.preferredType ?? 'ANY',
    },
  });

  const { register, watch, setValue, formState, trigger, handleSubmit } = form;
  const errors = formState.errors;

  const correct = watch('correctAnswers');
  const wrong = watch('wrongAnswers');

  // Keep the score in sync with attempts until the user takes it over.
  React.useEffect(() => {
    if (!scoreAuto) return;
    const c = Number(correct);
    const w = Number(wrong);
    if (Number.isFinite(c) && Number.isFinite(w) && (c > 0 || w > 0)) {
      setValue('expectedScore', computeScore(c, w), { shouldValidate: true });
    }
  }, [correct, wrong, scoreAuto, setValue]);

  async function next() {
    const valid = await trigger(STEP_FIELDS[step] ?? []);
    if (valid) setStep((s) => Math.min(3, s + 1));
  }

  async function onSubmit(values: CreatePredictionInput) {
    setSubmitting(true);

    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== null) formData.append(key, String(value));
    }

    const result = await createPredictionAction({ status: 'idle' }, formData);

    if (result.status === 'success') {
      // Do not clear `submitting` — the route change unmounts this form, and
      // resetting first would flash an enabled button mid-navigation.
      router.push(`/predictor/${result.predictionId}`);
      return;
    }

    setSubmitting(false);
    if (result.status === 'error') {
      toast.error(result.message);
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          form.setError(field as keyof CreatePredictionInput, { message: messages[0] });
        }
      }
    }
  }

  const attempted = (Number(correct) || 0) + (Number(wrong) || 0);
  const unattempted = Math.max(0, EXAM.totalQuestions - attempted);
  const activeStep = STEPS[step - 1]!;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div>
        <div className="flex items-center justify-between text-sm">
          <p className="font-medium">
            Step {step} of {STEPS.length} · <span className="text-muted-foreground">{activeStep.title}</span>
          </p>
          <p className="text-muted-foreground">{Math.round((step / STEPS.length) * 100)}%</p>
        </div>
        <Progress value={(step / STEPS.length) * 100} className="mt-2" />
      </div>

      <Card>
        <CardContent className="space-y-5 p-6">
          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="candidateName">Full name</Label>
                <Input
                  id="candidateName"
                  autoComplete="name"
                  placeholder="Dr. Aditi Sharma"
                  aria-invalid={Boolean(errors.candidateName)}
                  aria-describedby={errors.candidateName ? 'candidateName-error' : undefined}
                  {...register('candidateName')}
                />
                <FieldError id="candidateName-error" message={errors.candidateName?.message} />
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <RadioGroup
                  value={watch('gender')}
                  onValueChange={(v) => setValue('gender', v as 'MALE' | 'FEMALE' | 'OTHER', { shouldValidate: true })}
                  className="flex flex-wrap gap-2"
                >
                  {GENDER_OPTIONS.map((option) => (
                    <div key={option.value}>
                      <RadioGroupItem value={option.value} id={`gender-${option.value}`} className="peer sr-only" />
                      <Label
                        htmlFor={`gender-${option.value}`}
                        className={cn(
                          'flex cursor-pointer items-center rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors',
                          'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary-soft peer-data-[state=checked]:text-primary',
                          'hover:bg-muted peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
                        )}
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <FieldError id="gender-error" message={errors.gender?.message} />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="state">Domicile state</Label>
                  <Select
                    value={watch('state')}
                    onValueChange={(v) => setValue('state', v, { shouldValidate: true })}
                  >
                    <SelectTrigger id="state" aria-invalid={Boolean(errors.state)}>
                      <SelectValue placeholder="Select your state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Decides which state quota seats you can access.</p>
                  <FieldError id="state-error" message={errors.state?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={watch('category')}
                    onValueChange={(v) => setValue('category', v as CreatePredictionInput['category'], { shouldValidate: true })}
                  >
                    <SelectTrigger id="category" aria-invalid={Boolean(errors.category)}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError id="category-error" message={errors.category?.message} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subCategory">Sub category</Label>
                <Select
                  value={watch('subCategory')}
                  onValueChange={(v) => setValue('subCategory', v as CreatePredictionInput['subCategory'], { shouldValidate: true })}
                >
                  <SelectTrigger id="subCategory">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUB_CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="correctAnswers">Correct questions</Label>
                  <Input
                    id="correctAnswers"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={EXAM.totalQuestions}
                    placeholder="0"
                    aria-invalid={Boolean(errors.correctAnswers)}
                    {...register('correctAnswers')}
                  />
                  <FieldError id="correctAnswers-error" message={errors.correctAnswers?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wrongAnswers">Wrong questions</Label>
                  <Input
                    id="wrongAnswers"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={EXAM.totalQuestions}
                    placeholder="0"
                    aria-invalid={Boolean(errors.wrongAnswers)}
                    {...register('wrongAnswers')}
                  />
                  <FieldError id="wrongAnswers-error" message={errors.wrongAnswers?.message} />
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
                <p className="flex items-center gap-2 font-medium">
                  <Calculator className="h-4 w-4 text-primary" aria-hidden />
                  {EXAM.totalQuestions} questions · +{EXAM.marksPerCorrect} correct · −{EXAM.negativePerWrong} wrong
                </p>
                <p className="mt-1 text-muted-foreground">
                  Attempted {attempted} · Unattempted {unattempted}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedScore">
                  Expected score
                  {scoreAuto ? <span className="ml-2 text-xs font-normal text-muted-foreground">(calculated)</span> : null}
                </Label>
                <Input
                  id="expectedScore"
                  type="number"
                  inputMode="numeric"
                  max={EXAM.maxScore}
                  placeholder="0"
                  aria-invalid={Boolean(errors.expectedScore)}
                  {...register('expectedScore', { onChange: () => setScoreAuto(false) })}
                />
                <p className="text-xs text-muted-foreground">
                  Out of {EXAM.maxScore}. Edit this if you have a different estimate from your answer key.
                </p>
                <FieldError id="expectedScore-error" message={errors.expectedScore?.message} />
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <div className="space-y-2">
              <Label>Preferred college type</Label>
              <RadioGroup
                value={watch('preferredType')}
                onValueChange={(v) => setValue('preferredType', v as CreatePredictionInput['preferredType'], { shouldValidate: true })}
                className="grid gap-3 sm:grid-cols-2"
              >
                {PREFERRED_TYPE_OPTIONS.map((option) => (
                  <div key={option.value}>
                    <RadioGroupItem value={option.value} id={`type-${option.value}`} className="peer sr-only" />
                    <Label
                      htmlFor={`type-${option.value}`}
                      className={cn(
                        'flex cursor-pointer flex-col gap-0.5 rounded-lg border border-border p-4 transition-colors',
                        'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary-soft',
                        'hover:bg-muted peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
                      )}
                    >
                      <span className="text-sm font-semibold">{option.label}</span>
                      <span className="text-xs font-normal text-muted-foreground">{option.hint}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <Disclaimer className="pt-2" />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || submitting}
        >
          <ArrowLeft aria-hidden />
          Back
        </Button>

        {step < STEPS.length ? (
          <Button type="button" size="lg" onClick={next}>
            Continue
            <ArrowRight aria-hidden />
          </Button>
        ) : (
          <Button type="submit" size="lg" loading={submitting}>
            <Sparkles aria-hidden />
            Predict my rank
          </Button>
        )}
      </div>
    </form>
  );
}
