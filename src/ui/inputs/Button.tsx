import { cn } from '@lib/utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';

const button = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-9 px-3',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600',
        ghost: 'bg-transparent hover:bg-slate-100',
        outline: 'border border-blue-600 border-2 bg-white hover:bg-slate-50 focus:ring-blue-600',
      },
      size: { sm: 'h-8 px-2 text-xs', md: 'h-9 px-3', lg: 'h-10 px-4 text-base' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>;

export const Button = ({ className, variant, size, ...props }: Props) => {
  return <button className={cn(button({ variant, size }), className)} {...props} />;
};
