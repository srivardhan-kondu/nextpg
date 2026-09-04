'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

import { createPredictionAction } from '@/actions/prediction.actions';
import { createPredictionSchema, type CreatePredictionInput } from '@/validators/prediction.schema';
import {
  CATEGORY_OPTIONS, GENDER_OPTIONS, INDIAN_STATES, PREFERRED_TYPE_OPTIONS, SUB_CATEGORY_OPTIONS,
} from '@/lib/constants';
import { EXAM } from '@/config/site';
import { computeScore } from '@/services/prediction/scoring';
import { cn } from '@/lib/utils';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface PredictionFormProps {
  defaults?: Partial<CreatePredictionInput>;
}

function FieldError({ message, id }: { message?: string; id: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-[12px] text-red-600 mt-1">
      {message}
    </p>
  );
}

/** Label chip for gender / college-type toggle buttons */
function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-[44px] flex-1 items-center justify-center rounded-[8px] border text-[13.5px] leading-none transition-colors',
        active
          ? 'border-primary bg-[#e8f1ef] font-medium text-[#0b544e]'
          : 'border-black/[0.16] bg-white font-normal text-[#4e5654] hover:bg-[#faf9f6]',
      )}
    >
      {children}
    </button>
  );
}

/** Pill chips for single-select options (college type) */
function PillChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-5 py-[11px] text-[13.5px] leading-none transition-colors',
        active
          ? 'border-primary bg-[#e8f1ef] font-medium text-[#0b544e]'
          : 'border-black/[0.16] bg-white font-normal text-[#4e5654] hover:bg-[#faf9f6]',
      )}
    >
      {children}
    </button>
  );
}

/** Styled text input matching design doc */
function StyledInput({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  readOnly,
  suffix,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
}: {
  id: string;
  type?: string;
  value?: string | number;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  readOnly?: boolean;
  suffix?: React.ReactNode;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-[44px] items-center rounded-[8px] border px-[14px]',
        readOnly
          ? 'border-[#cfdedb] bg-[#f4f7f6]'
          : 'border-black/[0.16] bg-white',
        ariaInvalid && 'border-red-400',
      )}
    >
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        className="w-full bg-transparent text-[14.5px] leading-none text-[#15191a] tabular-nums placeholder:text-[#838c8a] focus:outline-none"
      />
      {suffix && (
        <span className="ml-2 shrink-0 text-[11.5px] leading-none text-[#0b544e]">{suffix}</span>
      )}
    </div>
  );
}

/** Styled select matching design doc */
function StyledSelect({
  id,
  value,
  onValueChange,
  placeholder,
  options,
  'aria-invalid': ariaInvalid,
}: {
  id: string;
  value?: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  'aria-invalid'?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        id={id}
        aria-invalid={ariaInvalid}
        className={cn(
          'h-[44px] rounded-[8px] border border-black/[0.16] bg-white px-[14px] text-[14.5px] text-[#15191a] focus:ring-1 focus:ring-primary',
          ariaInvalid && 'border-red-400',
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PredictionForm({ defaults }: PredictionFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
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

  const { watch, setValue, formState, handleSubmit } = form;
  const errors = formState.errors;

  const correct = watch('correctAnswers');
  const wrong = watch('wrongAnswers');
  const gender = watch('gender');
  const preferredType = watch('preferredType');

  // Keep the score in sync with attempts until the user takes it over.
  React.useEffect(() => {
    if (!scoreAuto) return;
    const c = Number(correct);
    const w = Number(wrong);
    if (Number.isFinite(c) && Number.isFinite(w) && (c > 0 || w > 0)) {
      setValue('expectedScore', computeScore(c, w), { shouldValidate: true });
    }
  }, [correct, wrong, scoreAuto, setValue]);

  async function onSubmit(values: CreatePredictionInput) {
    setSubmitting(true);
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== null) formData.append(key, String(value));
    }
    const result = await createPredictionAction({ status: 'idle' }, formData);
    if (result.status === 'success') {
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
  const expectedScore = watch('expectedScore');

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 gap-[52px] lg:grid-cols-[1fr_372px]">
        {/* ── Main form column ── */}
        <div className="flex flex-col gap-[34px]">
          {/* Section heading */}
          <div className="flex flex-col gap-[7px]">
            <h2 className="m-0 text-[27px] font-normal leading-[1.2] tracking-[-0.02em] text-[#15191a]">
              Let&apos;s estimate your rank
            </h2>
            <p className="m-0 max-w-[56ch] text-[14.5px] leading-[1.55] text-[#6b7472]">
              Rough answers are fine — we&apos;ll show you a range, not a false promise. You can re-run
              this once your score is confirmed.
            </p>
          </div>

          {/* ─ Your details ─ */}
          <div className="flex flex-col gap-4">
            <span className="text-[11.5px] font-medium leading-none tracking-[.1em] uppercase text-[#6b7472]">
              Your details
            </span>

            {/* Name + Gender */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-[7px]">
                <label htmlFor="candidateName" className="text-[13px] font-medium leading-none text-[#2b3332]">
                  Full name
                </label>
                <StyledInput
                  id="candidateName"
                  value={watch('candidateName')}
                  onChange={(e) => setValue('candidateName', e.target.value, { shouldValidate: true })}
                  placeholder="Dr. Aditi Sharma"
                  aria-invalid={Boolean(errors.candidateName)}
                  aria-describedby={errors.candidateName ? 'candidateName-error' : undefined}
                />
                <FieldError id="candidateName-error" message={errors.candidateName?.message} />
              </div>

              <div className="flex flex-col gap-[7px]">
                <span className="text-[13px] font-medium leading-none text-[#2b3332]">Gender</span>
                <div className="flex gap-2">
                  {GENDER_OPTIONS.map((opt) => (
                    <ToggleChip
                      key={opt.value}
                      active={gender === opt.value}
                      onClick={() => setValue('gender', opt.value as CreatePredictionInput['gender'], { shouldValidate: true })}
                    >
                      {opt.label}
                    </ToggleChip>
                  ))}
                </div>
                <FieldError id="gender-error" message={errors.gender?.message} />
              </div>
            </div>

            {/* State + Category + Sub-category */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-[7px]">
                <label htmlFor="state" className="text-[13px] font-medium leading-none text-[#2b3332]">
                  State
                </label>
                <StyledSelect
                  id="state"
                  value={watch('state')}
                  onValueChange={(v) => setValue('state', v, { shouldValidate: true })}
                  placeholder="Select state"
                  options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
                  aria-invalid={Boolean(errors.state)}
                />
                <FieldError id="state-error" message={errors.state?.message} />
              </div>

              <div className="flex flex-col gap-[7px]">
                <label htmlFor="category" className="text-[13px] font-medium leading-none text-[#2b3332]">
                  Category
                </label>
                <StyledSelect
                  id="category"
                  value={watch('category')}
                  onValueChange={(v) => setValue('category', v as CreatePredictionInput['category'], { shouldValidate: true })}
                  placeholder="Select category"
                  options={CATEGORY_OPTIONS}
                  aria-invalid={Boolean(errors.category)}
                />
                <FieldError id="category-error" message={errors.category?.message} />
              </div>

              <div className="flex flex-col gap-[7px]">
                <label htmlFor="subCategory" className="text-[13px] font-medium leading-none text-[#2b3332]">
                  Sub-category
                </label>
                <StyledSelect
                  id="subCategory"
                  value={watch('subCategory')}
                  onValueChange={(v) => setValue('subCategory', v as CreatePredictionInput['subCategory'], { shouldValidate: true })}
                  placeholder="None"
                  options={SUB_CATEGORY_OPTIONS}
                />
              </div>
            </div>
          </div>

          {/* ─ Your attempt ─ */}
          <div className="flex flex-col gap-4">
            <span className="text-[11.5px] font-medium leading-none tracking-[.1em] uppercase text-[#6b7472]">
              Your attempt
            </span>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-[7px]">
                <label htmlFor="correctAnswers" className="text-[13px] font-medium leading-none text-[#2b3332]">
                  Correct questions
                </label>
                <StyledInput
                  id="correctAnswers"
                  type="number"
                  value={correct ?? ''}
                  onChange={(e) => {
                    setValue('correctAnswers', Number(e.target.value), { shouldValidate: true });
                  }}
                  placeholder="0"
                  aria-invalid={Boolean(errors.correctAnswers)}
                  aria-describedby={errors.correctAnswers ? 'correctAnswers-error' : undefined}
                />
                <FieldError id="correctAnswers-error" message={errors.correctAnswers?.message} />
              </div>

              <div className="flex flex-col gap-[7px]">
                <label htmlFor="wrongAnswers" className="text-[13px] font-medium leading-none text-[#2b3332]">
                  Wrong questions
                </label>
                <StyledInput
                  id="wrongAnswers"
                  type="number"
                  value={wrong ?? ''}
                  onChange={(e) => {
                    setValue('wrongAnswers', Number(e.target.value), { shouldValidate: true });
                  }}
                  placeholder="0"
                  aria-invalid={Boolean(errors.wrongAnswers)}
                  aria-describedby={errors.wrongAnswers ? 'wrongAnswers-error' : undefined}
                />
                <FieldError id="wrongAnswers-error" message={errors.wrongAnswers?.message} />
              </div>

              <div className="flex flex-col gap-[7px]">
                <label htmlFor="expectedScore" className="text-[13px] font-medium leading-none text-[#2b3332]">
                  Expected score
                </label>
                <StyledInput
                  id="expectedScore"
                  type="number"
                  value={expectedScore ?? ''}
                  onChange={(e) => {
                    setScoreAuto(false);
                    setValue('expectedScore', Number(e.target.value), { shouldValidate: true });
                  }}
                  readOnly={scoreAuto && Boolean(expectedScore)}
                  suffix={scoreAuto && expectedScore ? 'auto-calculated' : undefined}
                  aria-invalid={Boolean(errors.expectedScore)}
                  aria-describedby={errors.expectedScore ? 'expectedScore-error' : undefined}
                />
                <FieldError id="expectedScore-error" message={errors.expectedScore?.message} />
              </div>
            </div>

            <p className="text-[12.5px] leading-relaxed text-[#6b7472]">
              Marking scheme: +{EXAM.marksPerCorrect} correct, −{EXAM.negativePerWrong} incorrect.
              {attempted > 0 ? ` Attempted ${attempted}.` : ''} Override the score if you already have your official card.
            </p>
          </div>

          {/* ─ Preferred college type ─ */}
          <div className="flex flex-col gap-3.5">
            <span className="text-[11.5px] font-medium leading-none tracking-[.1em] uppercase text-[#6b7472]">
              Preferred college type
            </span>
            <div className="flex flex-wrap gap-2.5">
              {PREFERRED_TYPE_OPTIONS.map((opt) => (
                <PillChip
                  key={opt.value}
                  active={preferredType === opt.value}
                  onClick={() => setValue('preferredType', opt.value as CreatePredictionInput['preferredType'], { shouldValidate: true })}
                >
                  {opt.label}
                </PillChip>
              ))}
            </div>
          </div>

          {/* Submit row */}
          <div className="flex items-center gap-4 pt-1.5">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-[9px] bg-primary px-[30px] py-[15px] text-[15px] font-medium leading-none text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 animate-pulse" aria-hidden />
                  Predicting…
                </span>
              ) : (
                'Predict my rank'
              )}
            </button>
            <span className="text-[13px] leading-relaxed text-[#6b7472]">
              Free — your rank band and seat counts. No credit used yet.
            </span>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="flex flex-col gap-4">
          {/* What you&apos;ll get card */}
          <div className="flex flex-col gap-3.5 rounded-[11px] border border-black/[0.08] bg-[#faf9f6] p-[22px]">
            <span className="text-[11.5px] font-medium leading-none tracking-[.1em] uppercase text-[#6b7472]">
              What you&apos;ll get
            </span>
            <div className="flex flex-col gap-[11px]">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-[#e8f1ef]" aria-hidden />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13.5px] font-medium leading-[1.3] text-[#15191a]">Free now</span>
                  <span className="text-[12.5px] leading-[1.45] text-[#6b7472]">
                    Rank band and opportunity counts
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-[#eceae5]" aria-hidden />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13.5px] font-medium leading-[1.3] text-[#15191a]">1 credit</span>
                  <span className="text-[12.5px] leading-[1.45] text-[#6b7472]">
                    Full college analysis, AIQ + state quota, dream validation, PDF
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Accuracy note card */}
          <div className="flex flex-col gap-2.5 rounded-[11px] border border-black/[0.10] bg-white p-5">
            <span className="text-[13.5px] font-medium leading-[1.3] text-[#15191a]">
              A note on accuracy
            </span>
            <p className="m-0 text-[12.5px] leading-[1.55] text-[#6b7472]">
              We model from four years of closing ranks and quota rules. Counselling outcomes shift
              year to year, so we always give you a band and tell you how confident we are.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
