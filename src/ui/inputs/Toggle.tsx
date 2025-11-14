import * as React from 'react';
import { cn } from '../../lib/utils/cn';

type Size = 'sm' | 'md' | 'lg';

export interface ToggleProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size' | 'checked'> {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  size?: Size;
  labelLeft?: string;
  labelRight?: string;
  className?: string;
}

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      checked,
      onChange,
      disabled = false,
      size = 'md',
      labelLeft,
      labelRight,
      className,
      id,
      ...rest
    },
    ref,
  ) => {
    const sizes = {
      sm: { track: 'w-10 h-5', dot: 'h-4 w-4', dotTranslate: 'translate-x-5' },
      md: { track: 'w-12 h-6', dot: 'h-5 w-5', dotTranslate: 'translate-x-6' },
      lg: { track: 'w-14 h-7', dot: 'h-6 w-6', dotTranslate: 'translate-x-7' },
    } as const;

    const s = sizes[size];

    return (
      <div className={cn('flex items-center gap-2', className)}>
        {labelLeft && (
          <span
            className={cn('text-xs select-none', !checked ? 'text-slate-800' : 'text-slate-500')}
          >
            {labelLeft}
          </span>
        )}

        <label
          htmlFor={id}
          className={cn(
            'relative inline-flex cursor-pointer items-center',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          <input
            id={id}
            ref={ref}
            type="checkbox"
            role="switch"
            aria-checked={checked}
            className="peer sr-only"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            {...rest}
          />

          {/* Track */}
          <span
            className={cn(
              'rounded-full transition-colors duration-200 ease-out ring-1 ring-inset',
              s.track,
              checked ? 'bg-blue-600 ring-blue-600/40' : 'bg-slate-200 ring-slate-300',
            )}
          />

          {/* Thumb */}
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute left-0.5 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out',
              s.dot,
              checked ? s.dotTranslate : 'translate-x-0',
            )}
          />

          {/* Focus ring */}
          <span
            className={cn(
              'absolute inset-0 rounded-full peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
              'peer-focus-visible:outline-indigo-500',
            )}
          />
        </label>

        {labelRight && (
          <span
            className={cn('text-xs select-none', checked ? 'text-slate-800' : 'text-slate-500')}
          >
            {labelRight}
          </span>
        )}
      </div>
    );
  },
);
Toggle.displayName = 'Toggle';
