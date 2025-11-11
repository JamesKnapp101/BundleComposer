import { cn } from '../../lib/utils/cn';

import { forwardRef } from 'react';

type TableContainerProps = {
  children: React.ReactNode;
  className?: string;
  stickyHeader?: boolean;
  compact?: boolean;
  zebra?: boolean;
};

export const TableContainer = forwardRef<HTMLDivElement, TableContainerProps>(
  ({ children, className, stickyHeader = true, compact = true, zebra = false }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // this is the one scroll host
          'h-full overflow-auto',
          // subtle scroll shadows; no width overflow
          'relative isolate',
          'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-4 before:bg-gradient-to-b before:from-black/5 before:to-transparent',
          'after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-4 after:bg-gradient-to-t after:from-black/5 after:to-transparent',
          'rounded-xl bg-white',
          className,
        )}
      >
        <div
          className={cn(
            '[&>table]:w-full [&>table]:table-fixed',
            stickyHeader &&
              '[&>table>thead>tr>th]:sticky [&>table>thead>tr>th]:top-0 [&>table>thead>tr>th]:z-10 [&>table>thead>tr>th]:bg-white',
            '[&>table>thead>tr>th]:text-slate-600 [&>table>thead>tr>th]:font-medium [&>table>thead>tr>th]:border-b [&>table>thead>tr>th]:border-slate-200',
            compact ? '[&>table>tbody>tr>td]:py-2.5' : '[&>table>tbody>tr>td]:py-3.5',
            '[&>table>tbody>tr>td]:align-middle',
            '[&>table>tbody>tr]:border-b [&>table>tbody>tr]:border-slate-100',
            '[&>table>tbody>tr:hover]:bg-slate-50/60',
            zebra && '[&>table>tbody>tr:nth-child(odd)]:bg-slate-50/40',
            '[&input[type=checkbox]:focus-visible]:outline-none [&input[type=checkbox]:focus-visible]:ring-2 [&input[type=checkbox]:focus-visible]:ring-indigo-400 [&input[type=checkbox]:focus-visible]:ring-offset-1',
          )}
        >
          {children}
        </div>
      </div>
    );
  },
);
