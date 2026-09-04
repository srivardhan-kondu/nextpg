'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { updateProfileAction, type ActionState } from '@/actions/auth.actions';
import { CATEGORY_OPTIONS, GENDER_OPTIONS, INDIAN_STATES } from '@/lib/constants';
import type { Category, Gender } from '@prisma/client';

interface ProfileFormProps {
  defaults: {
    name: string;
    phone: string;
    gender?: Gender;
    defaultState?: string;
    defaultCategory?: Category;
  };
}

const initialState: ActionState = { ok: false };

export function ProfileForm({ defaults }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  // Selects post through hidden inputs, so their values live in local state.
  const [gender, setGender] = React.useState<string | undefined>(defaults.gender);
  const [stateName, setStateName] = React.useState<string | undefined>(defaults.defaultState);
  const [category, setCategory] = React.useState<string | undefined>(defaults.defaultCategory);

  React.useEffect(() => {
    if (state.message) {
      if (state.ok) toast.success(state.message);
      else toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={defaults.name}
            autoComplete="name"
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
          {state.fieldErrors?.name ? (
            <p role="alert" className="text-sm text-destructive">
              {state.fieldErrors.name[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Mobile number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="9876543210"
            defaultValue={defaults.phone}
            autoComplete="tel-national"
            aria-invalid={Boolean(state.fieldErrors?.phone)}
          />
          {state.fieldErrors?.phone ? (
            <p role="alert" className="text-sm text-destructive">
              {state.fieldErrors.phone[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="gender-trigger">Gender</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger id="gender-trigger">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="gender" value={gender ?? ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state-trigger">Default state</Label>
          <Select value={stateName} onValueChange={setStateName}>
            <SelectTrigger id="state-trigger">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {INDIAN_STATES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="defaultState" value={stateName ?? ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category-trigger">Default category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category-trigger">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="defaultCategory" value={category ?? ''} />
        </div>
      </div>

      <Button type="submit" loading={pending}>
        <Save aria-hidden />
        Save changes
      </Button>
    </form>
  );
}
