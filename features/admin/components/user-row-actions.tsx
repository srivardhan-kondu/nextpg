'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { adjustCreditsAction, updateUserAction, type AdminState } from '@/actions/admin.actions';
import type { UserRole } from '@prisma/client';

const initialState: AdminState = { status: 'idle' };

interface UserRowActionsProps {
  user: { id: string; email: string; role: UserRole; isBlocked: boolean };
  canChangeRole: boolean;
  isSelf: boolean;
}

export function UserRowActions({ user, canChangeRole, isSelf }: UserRowActionsProps) {
  const router = useRouter();
  const [creditsOpen, setCreditsOpen] = React.useState(false);
  const [creditState, creditAction, creditPending] = useActionState(adjustCreditsAction, initialState);
  const [userState, userAction, userPending] = useActionState(updateUserAction, initialState);

  React.useEffect(() => {
    if (creditState.status === 'success') {
      toast.success(creditState.message);
      setCreditsOpen(false);
      router.refresh();
    } else if (creditState.status === 'error') {
      toast.error(creditState.message);
    }
  }, [creditState, router]);

  React.useEffect(() => {
    if (userState.status === 'success') {
      toast.success(userState.message);
      router.refresh();
    } else if (userState.status === 'error') {
      toast.error(userState.message);
    }
  }, [userState, router]);

  function submitUserChange(fields: Record<string, string>) {
    const formData = new FormData();
    formData.append('userId', user.id);
    for (const [key, value] of Object.entries(fields)) formData.append(key, value);
    React.startTransition(() => userAction(formData));
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${user.email}`} disabled={userPending}>
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Manage user</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={() => setCreditsOpen(true)}>Adjust credits</DropdownMenuItem>

          {canChangeRole ? (
            <>
              <DropdownMenuSeparator />
              {user.role !== 'ADMIN' ? (
                <DropdownMenuItem onSelect={() => submitUserChange({ role: 'ADMIN' })}>
                  Make admin
                </DropdownMenuItem>
              ) : null}
              {user.role !== 'USER' ? (
                <DropdownMenuItem onSelect={() => submitUserChange({ role: 'USER' })}>
                  Demote to user
                </DropdownMenuItem>
              ) : null}
            </>
          ) : null}

          {/* Blocking yourself would lock you out of the admin panel. */}
          {!isSelf ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => submitUserChange({ isBlocked: String(!user.isBlocked) })}
              >
                {user.isBlocked ? 'Unblock user' : 'Block user'}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={creditsOpen} onOpenChange={setCreditsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust credits</DialogTitle>
            <DialogDescription>
              Manual adjustment for {user.email}. Positive adds, negative removes. Written to the audit log.
            </DialogDescription>
          </DialogHeader>

          <form action={creditAction} className="space-y-4">
            <input type="hidden" name="userId" value={user.id} />

            <div className="space-y-2">
              <Label htmlFor="delta">Credits</Label>
              <Input id="delta" name="delta" type="number" min={-100} max={100} required placeholder="5" />
              {creditState.status === 'error' && creditState.fieldErrors?.delta ? (
                <p role="alert" className="text-sm text-destructive">{creditState.fieldErrors.delta[0]}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input id="reason" name="reason" required minLength={4} maxLength={200} placeholder="Goodwill — failed payment" />
              {creditState.status === 'error' && creditState.fieldErrors?.reason ? (
                <p role="alert" className="text-sm text-destructive">{creditState.fieldErrors.reason[0]}</p>
              ) : null}
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreditsOpen(false)}>Cancel</Button>
              <Button type="submit" loading={creditPending}>Apply adjustment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
