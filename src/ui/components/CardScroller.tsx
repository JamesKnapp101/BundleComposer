type CardScrollerProps = {
  children: React.ReactNode;
  /** exact height; use px or vh. Defaults to 46vh to mirror the list page feel */
  height?: string;
  className?: string;
};

export function CardScroller({ children, height = '46vh', className }: CardScrollerProps) {
  return (
    <div
      className={[
        'rounded-2xl bg-white shadow-sm ring-1 ring-slate-200',
        'overflow-auto [scrollbar-gutter:stable]',
        className ?? '',
      ].join(' ')}
      style={{ height }}
    >
      {children}
    </div>
  );
}
