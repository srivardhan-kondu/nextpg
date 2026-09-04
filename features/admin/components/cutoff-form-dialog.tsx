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
import { upsertCutoffAction, type AdminState } from '@/actions/admin.actions';
import { CATEGORY_OPTIONS, QUOTA_LABEL, SUB_CATEGORY_OPTIONS } from '@/lib/constants';
import { LATEST_CUTOFF_YEAR } from '@/config/site';
import type { QuotaType } from '@prisma/client';

interface Option {
  id: string;
  name: string;
}

const initialState: AdminState = { status: 'idle' };

export function CutoffFormDialog({
  colleges,
  branches,
}: {
  colleges: Option[];
  branches: Option[];
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState(upsertCutoffAction, initialState);

  const [collegeId, setCollegeId] = React.useState('');
  const [branchId, setBranchId] = React.useState('');
  const [quota, setQuota] = React.useState<string>('AIQ');
  const [category, setCategory] = React.useState<string>('GENERAL');
  const [subCategory, setSubCategory] = React.useState<string>('NONE');

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
          Add cutoff
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add or update a cutoff</DialogTitle>
          <DialogDescription>
            Matching rows (same college, branch, quota, category, round and year) are overwritten.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cutoff-college">College</Label>
            <Select value={collegeId} onValueChange={setCollegeId}>
              <SelectTrigger id="cutoff-college"><SelectValue placeholder="Select college" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {colleges.map((college) => (
                  <SelectItem key={college.id} value={college.id}>{college.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="collegeId" value={collegeId} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cutoff-branch">Branch</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger id="cutoff-branch"><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="branchId" value={branchId} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cutoff-quota">Quota</Label>
              <Select value={quota} onValueChange={setQuota}>
                <SelectTrigger id="cutoff-quota"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(QUOTA_LABEL) as QuotaType[]).map((key) => (
                    <SelectItem key={key} value={key}>{QUOTA_LABEL[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="quota" value={quota} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cutoff-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="cutoff-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="category" value={category} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cutoff-sub">Sub category</Label>
              <Select value={subCategory} onValueChange={setSubCategory}>
                <SelectTrigger id="cutoff-sub"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUB_CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="subCategory" value={subCategory} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cutoff-closing">Closing rank</Label>
              <Input id="cutoff-closing" name="closingRank" type="number" min={1} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cutoff-opening">Opening rank</Label>
              <Input id="cutoff-opening" name="openingRank" type="number" min={1} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cutoff-seats">Seats</Label>
              <Input id="cutoff-seats" name="seatCount" type="number" min={0} defaultValue={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cutoff-round">Round</Label>
              <Input id="cutoff-round" name="round" type="number" min={1} max={6} defaultValue={1} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cutoff-year">Year</Label>
              <Input
                id="cutoff-year"
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
            <Label htmlFor="cutoff-source">Source</Label>
            <Input id="cutoff-source" name="source" placeholder="MCC 2024 R3" />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={pending} disabled={!collegeId || !branchId}>Save cutoff</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
