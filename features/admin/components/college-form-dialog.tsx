'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { upsertCollegeAction, type AdminState } from '@/actions/admin.actions';
import { COLLEGE_TYPE_LABEL, INDIAN_STATES } from '@/lib/constants';
import type { CollegeType } from '@prisma/client';

export interface CollegeFormValues {
  id?: string;
  name?: string;
  shortName?: string | null;
  state?: string;
  city?: string | null;
  type?: CollegeType;
  university?: string | null;
  establishedYear?: number | null;
  website?: string | null;
  isActive?: boolean;
}

const initialState: AdminState = { status: 'idle' };

export function CollegeFormDialog({
  college,
  trigger,
}: {
  college?: CollegeFormValues;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState(upsertCollegeAction, initialState);
  const [stateName, setStateName] = React.useState(college?.state ?? '');
  const [type, setType] = React.useState<string>(college?.type ?? 'GOVERNMENT');
  const [isActive, setIsActive] = React.useState(college?.isActive ?? true);

  React.useEffect(() => {
    if (state.status === 'success') {
      toast.success(state.message);
      setOpen(false);
    } else if (state.status === 'error') {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus aria-hidden />
            Add college
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{college?.id ? 'Edit college' : 'Add college'}</DialogTitle>
          <DialogDescription>
            Colleges are referenced by cutoff rows, so deactivate rather than delete.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {college?.id ? <input type="hidden" name="id" value={college.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="college-name">Name</Label>
            <Input id="college-name" name="name" required defaultValue={college?.name ?? ''} />
            {state.status === 'error' && state.fieldErrors?.name ? (
              <p role="alert" className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="college-short">Short name</Label>
              <Input id="college-short" name="shortName" defaultValue={college?.shortName ?? ''} placeholder="AIIMS Delhi" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="college-city">City</Label>
              <Input id="college-city" name="city" defaultValue={college?.city ?? ''} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="college-state">State</Label>
              <Select value={stateName} onValueChange={setStateName}>
                <SelectTrigger id="college-state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="state" value={stateName} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="college-type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="college-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(COLLEGE_TYPE_LABEL) as CollegeType[]).map((key) => (
                    <SelectItem key={key} value={key}>{COLLEGE_TYPE_LABEL[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="type" value={type} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="college-university">University</Label>
              <Input id="college-university" name="university" defaultValue={college?.university ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="college-year">Established</Label>
              <Input
                id="college-year"
                name="establishedYear"
                type="number"
                min={1800}
                max={2100}
                defaultValue={college?.establishedYear ?? ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="college-website">Website</Label>
            <Input id="college-website" name="website" type="url" defaultValue={college?.website ?? ''} placeholder="https://" />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="college-active" className="cursor-pointer">Active</Label>
            <Switch id="college-active" checked={isActive} onCheckedChange={setIsActive} />
            <input type="hidden" name="isActive" value={String(isActive)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={pending} disabled={!stateName}>Save college</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
