import * as React from 'react';

type Orientation = 'horizontal' | 'vertical';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: Orientation;
  inset?: boolean;
  decorative?: boolean;
  label?: React.ReactNode;
  labelClassName?: string;
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  (
    {
      orientation = 'horizontal',
      inset = false,
      decorative = false,
      label,
      className,
      labelClassName,
      role,
      ...props
    },
    ref,
  ) => {
    if (label && orientation === 'horizontal') {
      return (
        <div className={cn('flex items-center', inset && 'pl-4', className)} {...props}>
          <div className="h-px grow bg-border/70" />
          <div
            className={cn(
              'mx-2 text-xs uppercase tracking-wide text-muted-foreground',
              labelClassName,
            )}
            role={decorative ? undefined : 'separator'}
            aria-orientation="horizontal"
          >
            {label}
          </div>
          <div className="h-px grow bg-border/70" />
        </div>
      );
    }

    const isHorizontal = orientation === 'horizontal';
    return (
      <div
        ref={ref}
        role={role ?? (decorative ? undefined : 'separator')}
        aria-orientation={isHorizontal ? 'horizontal' : 'vertical'}
        className={cn(
          'bg-border/70',
          isHorizontal ? 'h-px w-full' : 'w-px h-full',
          isHorizontal ? 'my-2' : 'mx-2',
          inset && isHorizontal && 'ml-4',
          className,
        )}
        {...props}
      />
    );
  },
);
Separator.displayName = 'Separator';
