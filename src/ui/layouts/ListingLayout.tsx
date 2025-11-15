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
          'min-h-dvh w-full overflow-hidden bg-white',
          'px-3 sm:px-4 lg:px-6',
          className,
        )}
        {...rest}
      >
        <div className="mx-auto max-w-[1600px] xl:max-w-[1800px] h-dvh flex flex-col gap-3">
          {(header || toolbar) && (
            <section
              className={cn(
                stickyHeader && 'sticky top-0 z-20',
                'rounded-2xl bg-white shadow-sm ring-1 ring-slate-200',
                'mt-5',
              )}
            >
              <div className="px-4 py-3">{header}</div>
              {toolbar && <div className="border-t border-slate-200 px-4 py-2">{toolbar}</div>}
            </section>
          )}
          <main
            className={cn(
              'relative flex-1 min-h-0',
              'rounded-2xl bg-white shadow-sm ring-1 ring-slate-200',
              'p-0 sm:p-1',
              'mb-5',
              bodyClassName,
            )}
          >
            <div className="h-full">{children}</div>
          </main>
          {actionBar && (
            <div className="rounded-xl border border-slate-200 bg-white/90 backdrop-blur px-4 py-2 shadow-sm">
              {actionBar}
            </div>
          )}
          {footer && (
            <footer className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              {footer}
            </footer>
          )}
        </div>
      </div>
    );
  },
);
