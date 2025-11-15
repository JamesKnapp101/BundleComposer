import type { ReactNode } from 'react';
import { cn } from '../../lib/utils/cn';

export const Badge = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs',
        'border-slate-300 bg-slate-50 text-slate-700',
        className,
      )}
    >
      {children}
    </span>
  );
};
