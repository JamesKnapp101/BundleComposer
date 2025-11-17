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
          // slightly nicer background
          'min-h-dvh w-full overflow-hidden bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50',
          'px-2 sm:px-4 lg:px-6 xl:px-8', // 🔹 a bit more usable width on large screens
          className,
        )}
        {...rest}
      >
        <div
          className={cn(
            'mx-auto h-dvh flex flex-col gap-3',
            // 🔹 widen the content area a bit
            'w-full max-w-[1600px] xl:max-w-[1900px]',
          )}
        >
          {(header || toolbar) && (
            <section
              className={cn(
                stickyHeader && 'sticky top-0 z-20',
                'rounded-2xl bg-white/95 shadow-sm ring-1 ring-slate-200/80 backdrop-blur-sm',
                'mt-4',
              )}
            >
              <div className="px-4 py-3">{header}</div>
              {toolbar && <div className="border-t border-slate-200/80 px-4 py-2">{toolbar}</div>}
            </section>
          )}
          {actionBar && (
            <div className="rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur px-4 py-2 shadow-sm">
              {actionBar}
            </div>
          )}
          <main
            className={cn(
              'relative flex-1 min-h-0',
              'rounded-2xl bg-white/95 shadow-sm ring-1 ring-slate-200/80 backdrop-blur-sm',
              'p-0 sm:p-1',
              'mb-4',
              bodyClassName,
            )}
          >
            <div className="h-full">{children}</div>
          </main>
          {footer && (
            <footer className="rounded-xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm">
              {footer}
            </footer>
          )}
        </div>
      </div>
    );
  },
);
