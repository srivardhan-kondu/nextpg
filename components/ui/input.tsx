import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      'flex h-[44px] w-full rounded-[8px] border border-black/[0.16] bg-white px-[14px] py-2 text-[14.5px] leading-none text-[#15191a] shadow-none transition-colors',
      'placeholder:text-[#838c8a]',
      'focus-visible:outline-none focus-visible:border-[#10736b] focus-visible:ring-1 focus-visible:ring-[#10736b]',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#faf9f6]',
      'aria-[invalid=true]:border-red-400',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
