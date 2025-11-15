import type { ReactNode } from 'react';

export const Labeled = ({
  children,
  label,
  hint,
  required,
  className,
}: {
  children: ReactNode;
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
}) => {
  return (
    <div className={['group flex flex-col gap-1.5 rounded-lg', className].join(' ')}>
      <div className="flex items-baseline justify-between">
        <label
          className={[
            'text-[11px] font-medium uppercase tracking-wide',
            'text-slate-700',
            'group-focus-within:text-indigo-700',
          ].join(' ')}
        >
          {label}
          {required && <span className="ml-1 text-rose-600">*</span>}
        </label>
        {hint && (
          <span className="text-[11px] text-slate-500 group-focus-within:text-slate-600">
            {hint}
          </span>
        )}
      </div>
      <div className="min-h-[2.25rem]">{children}</div>
    </div>
  );
};
