import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../../lib/utils/cn';

type ListingLayoutProps = {
  header?: ReactNode;
  toolbar?: ReactNode;
  actionBar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  stickyHeader?: boolean;
  height?: CSSProperties['height'];
  variant?: 'plain' | 'subtle';
  className?: string;
  bodyClassName?: string;
  'data-testid'?: string;
};

export const ListingLayout = forwardRef<HTMLDivElement, ListingLayoutProps>(
  (
    {
      header,
      toolbar,
      actionBar,
      footer,
      children,
      stickyHeader = true,
      height = '90vh',
      variant = 'subtle',
      className,
      bodyClassName,
      ...rest
    },
    ref,
  ) => {
    return (
      <div
        id="listing-layout-container"
        ref={ref}
        className={cn(
          'flex flex-col gap-3',
          variant === 'subtle' && 'bg-slate-50',
          variant === 'plain' && 'bg-white',
          className,
        )}
        {...rest}
      >
        {(header || toolbar) && (
          <header
            className={cn(
              'z-10',
              stickyHeader && 'sticky top-0',
              'bg-inherit/80 backdrop-blur supports-[backdrop-filter]:bg-inherit/70',
              'border-b border-slate-200',
            )}
          >
            {header && <div className="px-4 py-3">{header}</div>}
            {toolbar && <div className="px-4 py-2 border-t border-slate-200">{toolbar}</div>}
          </header>
        )}

        <main
          className={cn(
            'relative h-full overflow-auto [scrollbar-gutter:stable_both-edges]',
            bodyClassName,
          )}
          style={{ height }}
        >
          {children}
        </main>

        {actionBar && (
          <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-white/90 backdrop-blur">
            <div className="px-4 py-2">{actionBar}</div>
          </div>
        )}

        {footer && (
          <footer className="px-4 py-3 border-t border-slate-200 bg-white">{footer}</footer>
        )}
      </div>
    );
  },
);
ListingLayout.displayName = 'ListingLayout';
