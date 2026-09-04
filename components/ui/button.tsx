import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-[13.5px] font-medium leading-none transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10736b] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-[#10736b] text-white hover:opacity-90',
        destructive: 'bg-[#c0392b] text-white hover:opacity-90',
        outline: 'border border-black/[0.14] bg-white text-[#15191a] hover:bg-[#faf9f6]',
        secondary: 'bg-[#e8f1ef] text-[#0b544e] hover:bg-[#d4e7e3]',
        ghost: 'bg-transparent text-[#4e5654] hover:bg-[#f0f0ec] hover:text-[#15191a]',
        link: 'text-[#10736b] underline-offset-4 hover:underline bg-transparent',
        soft: 'bg-[#e8f1ef] text-[#0b544e] hover:bg-[#d4e7e3]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-[7px] px-3 text-[13px]',
        lg: 'h-11 rounded-[9px] px-6 text-[15px]',
        xl: 'h-12 rounded-[9px] px-7 text-[15px]',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    // Slot requires exactly one child, and an expression that evaluates to null
    // still counts as a child — so with asChild we must pass `children` alone,
    // never a fragment or array. The spinner is a non-asChild affordance anyway.
    const content = asChild ? (
      children
    ) : (
      <>
        {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {children}
      </>
    );

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        // `disabled` is not a valid attribute on the element asChild renders
        // (usually an anchor), so it is only applied to a real button.
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {content}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
