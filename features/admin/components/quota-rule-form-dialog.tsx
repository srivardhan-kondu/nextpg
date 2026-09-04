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
import { upsertQuotaRuleAction, type AdminState } from '@/actions/admin.actions';
import { CATEGORY_OPTIONS, INDIAN_STATES, QUOTA_LABEL } from '@/lib/constants';
import { LATEST_CUTOFF_YEAR } from '@/config/site';
import type { QuotaType } from '@prisma/client';

const initialState: AdminState = { status: 'idle' };
const ALL_CATEGORIES = '__all__';

export function QuotaRuleFormDialog() {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState(upsertQuotaRuleAction, initialState);

  const [stateName, setStateName] = React.useState('');
  const [quota, setQuota] = React.useState<string>('STATE');
  const [category, setCategory] = React.useState<string>(ALL_CATEGORIES);
  const [requiresDomicile, setRequiresDomicile] = React.useState(true);
  const [isActive, setIsActive] = React.useState(true);

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
        <Button>
          <Plus aria-hidden />
          Add quota rule
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add or update a quota rule</DialogTitle>
          <DialogDescription>
            Rules decide which quotas a candidate can compete in. Leave the category blank to apply to all.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rule-state">State</Label>
              <Select value={stateName} onValueChange={setStateName}>
                <SelectTrigger id="rule-state"><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {INDIAN_STATES.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="state" value={stateName} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-quota">Quota</Label>
              <Select value={quota} onValueChange={setQuota}>
                <SelectTrigger id="rule-quota"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(QUOTA_LABEL) as QuotaType[]).map((key) => (
                    <SelectItem key={key} value={key}>{QUOTA_LABEL[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="quota" value={quota} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="rule-category"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* An empty value means "applies to every category" in the action. */}
            <input type="hidden" name="category" value={category === ALL_CATEGORIES ? '' : category} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="rule-reservation">Reservation %</Label>
              <Input id="rule-reservation" name="reservationPct" type="number" min={0} max={100} step="0.01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-share">Seat share %</Label>
              <Input id="rule-share" name="seatSharePct" type="number" min={0} max={100} step="0.01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-year">Year</Label>
              <Input
                id="rule-year"
                name="academicYear"
                type="number"
                min={2015}
                max={2100}
                defaultValue={LATEST_CUTOFF_YEAR}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule-notes">Notes</Label>
            <Textarea id="rule-notes" name="notes" rows={2} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="rule-domicile" className="cursor-pointer">Requires domicile</Label>
              <Switch id="rule-domicile" checked={requiresDomicile} onCheckedChange={setRequiresDomicile} />
              <input type="hidden" name="requiresDomicile" value={String(requiresDomicile)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="rule-active" className="cursor-pointer">Active</Label>
              <Switch id="rule-active" checked={isActive} onCheckedChange={setIsActive} />
              <input type="hidden" name="isActive" value={String(isActive)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={pending} disabled={!stateName}>Save rule</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
