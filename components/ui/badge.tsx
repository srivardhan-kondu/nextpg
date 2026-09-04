import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-medium leading-none transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default: 'bg-[#10736b] text-white',
        secondary: 'bg-[#eceae5] text-[#4e5654]',
        outline: 'border border-black/[0.12] text-[#15191a]',
        soft: 'bg-[#e8f1ef] text-[#0b544e]',
        strong: 'bg-[#e8f1ef] text-[#0b544e]',
        moderate: 'bg-[#fef3c7] text-[#a07520]',
        stretch: 'bg-[#fde8d8] text-[#8a4a22]',
        destructive: 'bg-[#fee2e2] text-[#c0392b]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
