'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CollegeCombobox, type CollegeOption } from './college-combobox';
import { DreamResult } from './dream-result';
import { validateDreamAction } from '@/actions/dream.actions';
import { BRANCHES } from '@/lib/constants';
import type { DreamValidationResult } from '@/types/prediction';

interface DreamValidatorFormProps {
  predictionId: string;
  /** Prefills from a previous validation so the form is not empty on return. */
  initialBranch?: string;
}

export function DreamValidatorForm({ predictionId, initialBranch }: DreamValidatorFormProps) {
  const router = useRouter();
  const [branch, setBranch] = React.useState<string | undefined>(initialBranch);
  const [college, setCollege] = React.useState<CollegeOption | null>(null);
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<DreamValidationResult | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!branch) {
      toast.error('Select a dream branch first.');
      return;
    }

    setPending(true);
    const formData = new FormData();
    formData.append('predictionId', predictionId);
    formData.append('dreamBranch', branch);
    if (college) {
      formData.append('dreamCollegeId', college.id);
      formData.append('dreamCollegeName', college.name);
    }

    const outcome = await validateDreamAction({ status: 'idle' }, formData);
    setPending(false);

    if (outcome.status === 'success') {
      setResult(outcome.result);
      // Refresh so the saved validation shows up in history and in the PDF.
      router.refresh();
    } else if (outcome.status === 'error') {
      toast.error(outcome.message);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dreamBranch">Dream branch</Label>
                <Select value={branch} onValueChange={setBranch}>
                  <SelectTrigger id="dreamBranch">
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Required.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dreamCollege">Dream college</Label>
                <CollegeCombobox value={college} onChange={setCollege} />
                <p className="text-xs text-muted-foreground">
                  Optional — leave blank to validate the branch alone.
                </p>
              </div>
            </div>

            <Button type="submit" size="lg" loading={pending} disabled={!branch}>
              <Sparkles aria-hidden />
              Validate my dream
            </Button>
          </form>
        </CardContent>
      </Card>

      {result ? <DreamResult result={result} /> : null}
    </div>
  );
}
