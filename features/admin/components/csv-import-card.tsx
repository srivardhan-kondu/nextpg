'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ImportResult } from '@/actions/import.actions';

interface CsvImportCardProps {
  title: string;
  description: string;
  columns: string[];
  sample: string;
  action: (prev: ImportResult, formData: FormData) => Promise<ImportResult>;
}

const initialState: ImportResult = { status: 'idle' };

export function CsvImportCard({ title, description, columns, sample, action }: CsvImportCardProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.status === 'success') {
      toast.success(state.message ?? 'Import complete.');
      formRef.current?.reset();
    } else if (state.status === 'error') {
      toast.error(state.message ?? 'Import failed.');
    }
  }, [state]);

  const inputId = `csv-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Required columns</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {columns.map((column) => (
              <code key={column} className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {column}
              </code>
            ))}
          </div>
        </div>

        <details className="rounded-lg border border-border">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium">Sample CSV</summary>
          <pre className="overflow-x-auto border-t border-border bg-muted/50 p-3 text-xs">
            <code>{sample}</code>
          </pre>
        </details>

        <form ref={formRef} action={formAction} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={inputId}>CSV file</Label>
            <Input id={inputId} name="file" type="file" accept=".csv,text/csv" required />
          </div>
          <Button type="submit" loading={pending}>
            <Upload aria-hidden />
            Import
          </Button>
        </form>

        {state.status === 'success' ? (
          <Alert variant="info">
            <CheckCircle2 aria-hidden />
            <AlertTitle>Import complete</AlertTitle>
            <AlertDescription>
              {state.created ?? 0} created · {state.updated ?? 0} updated · {state.skipped ?? 0} skipped
            </AlertDescription>
          </Alert>
        ) : null}

        {state.errors && state.errors.length > 0 ? (
          <Alert variant="warning">
            <AlertTriangle aria-hidden />
            <AlertTitle>{state.errors.length} row problem{state.errors.length === 1 ? '' : 's'}</AlertTitle>
            <AlertDescription>
              <ul className="mt-1 space-y-0.5 text-xs">
                {state.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
