'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { upsertBranchAction, type AdminState } from '@/actions/admin.actions';

export interface BranchFormValues {
  id?: string;
  name?: string;
  code?: string | null;
  degree?: string;
  isClinical?: boolean;
  popularity?: number;
  description?: string | null;
  isActive?: boolean;
}

const DEGREES = ['MD', 'MS', 'DIPLOMA', 'DNB'] as const;
const initialState: AdminState = { status: 'idle' };

export function BranchFormDialog({
  branch,
  trigger,
}: {
  branch?: BranchFormValues;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState(upsertBranchAction, initialState);
  const [degree, setDegree] = React.useState(branch?.degree ?? 'MD');
  const [isClinical, setIsClinical] = React.useState(branch?.isClinical ?? true);
  const [isActive, setIsActive] = React.useState(branch?.isActive ?? true);

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
            Add branch
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{branch?.id ? 'Edit branch' : 'Add branch'}</DialogTitle>
          <DialogDescription>Popularity controls the order branches appear in dropdowns.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {branch?.id ? <input type="hidden" name="id" value={branch.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="branch-name">Name</Label>
            <Input id="branch-name" name="name" required defaultValue={branch?.name ?? ''} />
            {state.status === 'error' && state.fieldErrors?.name ? (
              <p role="alert" className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="branch-code">Code</Label>
              <Input id="branch-code" name="code" defaultValue={branch?.code ?? ''} placeholder="MD-GM" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-degree">Degree</Label>
              <Select value={degree} onValueChange={setDegree}>
                <SelectTrigger id="branch-degree"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEGREES.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="degree" value={degree} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-popularity">Popularity</Label>
              <Input
                id="branch-popularity"
                name="popularity"
                type="number"
                min={0}
                max={100}
                defaultValue={branch?.popularity ?? 0}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch-description">Description</Label>
            <Textarea id="branch-description" name="description" rows={3} defaultValue={branch?.description ?? ''} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="branch-clinical" className="cursor-pointer">Clinical</Label>
              <Switch id="branch-clinical" checked={isClinical} onCheckedChange={setIsClinical} />
              <input type="hidden" name="isClinical" value={String(isClinical)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="branch-active" className="cursor-pointer">Active</Label>
              <Switch id="branch-active" checked={isActive} onCheckedChange={setIsActive} />
              <input type="hidden" name="isActive" value={String(isActive)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={pending}>Save branch</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
