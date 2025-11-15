import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils/cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm',
        'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
